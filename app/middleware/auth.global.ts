export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip auth check for public pages
  const publicPages = ['/login']
  if (publicPages.includes(to.path)) {
    return
  }

  const token = useCookie('auth-token')

  // No token at all? Redirect to login
  if (!token.value) {
    return navigateTo('/login')
  }

  // On server-side, token exists - let request proceed
  if (import.meta.server) {
    return
  }

  // Client-side: check user state
  const { user, fetchUser, initialized } = useAuth()

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
  await fetchUser()

  // Check again after fetch
  if (!user.value) {
    // Last resort: try to restore from localStorage directly
    if (import.meta.client) {
      const storedUser = localStorage.getItem('ocn-user')
      if (storedUser) {
        try {
          // Call the API to verify the session is still valid
          const response = await $fetch<{ user: any }>('/api/auth/me')
          if (response.user) {
            // User is valid, let the page load - useAuth will pick it up
            return
          }
        } catch {
          // Session invalid, redirect to login
          localStorage.removeItem('ocn-user')
        }
      }
    }
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
