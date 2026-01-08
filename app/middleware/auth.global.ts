export default defineNuxtRouteMiddleware(async (to, from) => {
  // Skip auth check for public pages
  const publicPages = ['/login']
  if (publicPages.includes(to.path)) {
    return
  }

  // On server-side, skip auth redirect - let client handle it
  // This prevents SSR from redirecting before client can hydrate auth state
  if (import.meta.server) {
    // Still try to fetch user on server if cookie exists
    const token = useCookie('auth-token')
    if (!token.value) {
      return navigateTo('/login')
    }
    // Token exists, let the request proceed - auth will be verified by API calls
    return
  }

  // Client-side auth check
  const { user, fetchUser, initialized } = useAuth()

  // Fetch user if not initialized
  if (!initialized.value) {
    await fetchUser()
  }

  // Redirect to login if not authenticated
  if (!user.value) {
    return navigateTo('/login')
  }

  // Redirect technicians to their dashboard if accessing admin pages
  if (user.value.role === 'TECHNICIAN') {
    const technicianPages = ['/technician', '/technician/']
    const isTechnicianPage = to.path.startsWith('/technician')
    const isLoginPage = to.path === '/login'
    const isProfilePage = to.path === '/profile'

    if (!isTechnicianPage && !isLoginPage && !isProfilePage) {
      return navigateTo('/technician')
    }
  }

  // Redirect non-technicians from technician pages
  if (user.value.role !== 'TECHNICIAN' && to.path.startsWith('/technician')) {
    return navigateTo('/dashboard')
  }
})
