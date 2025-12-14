export default defineNuxtRouteMiddleware(async (to) => {
    // Skip auth check for public pages
    const publicPages = ['/login']
    if (publicPages.includes(to.path)) {
        return
    }

    const { user, fetchUser, initialized } = useAuth()

    // Fetch user if not initialized
    if (!initialized.value) {
        await fetchUser()
    }

    // Redirect to login if not authenticated
    if (!user.value) {
        return navigateTo('/login')
    }

    // Redirect technicians to their dashboard
    if (user.value.role === 'TECHNICIAN' && to.path === '/dashboard') {
        return navigateTo('/technician/dashboard')
    }
})
