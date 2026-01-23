export default defineNuxtPlugin(async () => {
  const { user, fetchUser } = useAuth()
  const token = useCookie('auth-token')

  console.log('[Auth Plugin] Initializing...')
  console.log('[Auth Plugin] Token exists:', !!token.value)
  console.log('[Auth Plugin] User exists:', !!user.value)

  // If token exists but user not loaded, fetch user
  if (token.value && !user.value) {
    try {
      console.log('[Auth Plugin] Fetching user on init...')
      await fetchUser()
      console.log('[Auth Plugin] User fetched:', !!user.value)
    } catch (error) {
      console.error('[Auth Plugin] Failed to fetch user:', error)
    }
  }
})
