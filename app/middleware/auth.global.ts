export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip auth check for public pages
  const publicPages = ['/login']
  if (publicPages.includes(to.path)) {
    return
  }

  // On server-side, skip auth check entirely - let client handle it
  // This prevents redirect loops during SSR
  if (import.meta.server) {
    return
  }

  // Client-side logic
  const token = useCookie('auth-token')
  const { user, fetchUser, initialized } = useAuth()

  console.log('[Auth Client] Checking auth for:', to.path)
  console.log('[Auth Client] Token from useCookie:', !!token.value)
  console.log('[Auth Client] User exists:', !!user.value)
  console.log('[Auth Client] Initialized:', initialized.value)

  // Check document.cookie as fallback
  const docCookie = document.cookie
  const hasTokenInDoc = docCookie.includes('auth-token=')
  console.log('[Auth Client] Token in document.cookie:', hasTokenInDoc)

  // No token anywhere? Redirect to login
  if (!token.value && !hasTokenInDoc) {
    console.log('[Auth Client] No token found, redirecting to login')
    return navigateTo('/login')
  }

  // If useCookie doesn't have token but document.cookie does, there's a sync issue
  if (!token.value && hasTokenInDoc) {
    console.log('[Auth Client] Cookie sync issue, extracting from document.cookie...')
    // Try to get token from document.cookie
    const match = docCookie.match(/auth-token=([^;]+)/)
    if (match) {
      token.value = match[1]
    }
  }

  // If user is already set, proceed
  if (user.value) {
    // Role-based redirects
    if (user.value.role === 'TECHNICIAN') {
      const isTechnicianPage = to.path.startsWith('/technician')
      const isProfilePage = to.path === '/profile'
      if (!isTechnicianPage && !isProfilePage) {
        return navigateTo('/technician')
      }
    } else if (to.path.startsWith('/technician')) {
      return navigateTo('/dashboard')
    }
    return
  }

  // User not set - try to fetch
  try {
    console.log('[Auth Client] Fetching user...')
    await fetchUser()
    console.log('[Auth Client] Fetch complete, user:', !!user.value)
  } catch (error) {
    console.error('[Auth Client] Failed to fetch user:', error)
    // On fetch failure, clear invalid token and redirect
    token.value = null
    localStorage.removeItem('ocn-user')
    return navigateTo('/login')
  }

  // Check again after fetch
  if (!user.value) {
    console.log('[Auth Client] User not found after fetch, redirecting to login')
    // Clear invalid token
    token.value = null
    localStorage.removeItem('ocn-user')
    return navigateTo('/login')
  }

  // Role-based redirects
  if (user.value.role === 'TECHNICIAN') {
    const isTechnicianPage = to.path.startsWith('/technician')
    const isProfilePage = to.path === '/profile'
    if (!isTechnicianPage && !isProfilePage) {
      return navigateTo('/technician')
    }
  } else if (to.path.startsWith('/technician')) {
    return navigateTo('/dashboard')
  }
})
