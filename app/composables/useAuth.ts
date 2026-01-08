import type { UserRole } from '@prisma/client'

interface User {
  id: string
  name: string
  email: string
  username: string
  role: UserRole
  phone?: string
  address?: string
  createdAt?: string
  technicianId?: string
}

// Use useState for proper SSR hydration - state will persist between server and client
const useAuthState = () => {
  const user = useState<User | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => false)
  const initialized = useState<boolean>('auth-initialized', () => false)
  return { user, loading, initialized }
}

export const useAuth = () => {
  // Get shared state from useState (SSR-compatible)
  const { user, loading, initialized } = useAuthState()

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  const canAccess = (feature: string): boolean => {
    const permissions: Record<string, UserRole[]> = {
      // Customers
      'customers.view': ['OWNER', 'ADMIN', 'VIEWER'],
      'customers.edit': ['OWNER', 'ADMIN'],
      'customers.delete': ['OWNER'],

      // Projects
      'projects.view.all': ['OWNER', 'ADMIN', 'VIEWER'],
      'projects.view.assigned': ['OWNER', 'ADMIN', 'TECHNICIAN'],
      'projects.edit': ['OWNER', 'ADMIN'],
      'projects.delete': ['OWNER'],

      // Quotations
      'quotations.view': ['OWNER', 'ADMIN', 'VIEWER'],
      'quotations.edit': ['OWNER', 'ADMIN'],
      'quotations.approve': ['OWNER', 'ADMIN'],

      // Inventory
      'inventory.view': ['OWNER', 'ADMIN', 'TECHNICIAN', 'VIEWER'],
      'inventory.manage': ['OWNER', 'ADMIN'],

      // Purchase Orders
      'po.view': ['OWNER', 'ADMIN'],
      'po.manage': ['OWNER', 'ADMIN'],

      // Finance
      'finance.view.all': ['OWNER', 'ADMIN'],
      'finance.view.own': ['OWNER', 'ADMIN', 'TECHNICIAN'],
      'finance.manage': ['OWNER', 'ADMIN'],

      // Reports
      'reports.full': ['OWNER', 'ADMIN'],
      'reports.own': ['OWNER', 'ADMIN', 'TECHNICIAN'],

      // Settings
      'settings.view': ['OWNER', 'ADMIN'],
      'settings.manage': ['OWNER'],

      // Users
      'users.view': ['OWNER'],
      'users.manage': ['OWNER'],
    }

    return hasRole(permissions[feature] || [])
  }

  const isTechnician = (): boolean => user.value?.role === 'TECHNICIAN'
  const isOwner = (): boolean => user.value?.role === 'OWNER'
  const isAdmin = (): boolean => user.value?.role === 'ADMIN'
  const isViewer = (): boolean => user.value?.role === 'VIEWER'

  const login = async (username: string, password: string): Promise<User | null> => {
    loading.value = true
    try {
      const response = await $fetch<{ user: User; token: string }>('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      })

      user.value = response.user

      // Store token in cookie with proper settings
      const token = useCookie('auth-token', {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        sameSite: 'lax',
      })
      token.value = response.token

      // Backup user to localStorage for persistence
      if (import.meta.client) {
        localStorage.setItem('ocn-user', JSON.stringify(response.user))
      }

      return response.user
    } finally {
      loading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    loading.value = true
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore logout errors
    } finally {
      user.value = null
      const token = useCookie('auth-token')
      token.value = null
      // Clear localStorage
      if (import.meta.client) {
        localStorage.removeItem('ocn-user')
      }
      loading.value = false
      await navigateTo('/login')
    }
  }

  const fetchUser = async (): Promise<void> => {
    if (initialized.value) return

    const token = useCookie('auth-token')

    // Try to restore user from localStorage first (client-side only)
    if (import.meta.client && !user.value) {
      const storedUser = localStorage.getItem('ocn-user')
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser)
        } catch {
          localStorage.removeItem('ocn-user')
        }
      }
    }

    if (!token.value) {
      // No token - clear user and mark initialized
      user.value = null
      if (import.meta.client) {
        localStorage.removeItem('ocn-user')
      }
      initialized.value = true
      return
    }

    loading.value = true
    try {
      const response = await $fetch<{ user: User }>('/api/auth/me')
      user.value = response.user
      // Update localStorage
      if (import.meta.client) {
        localStorage.setItem('ocn-user', JSON.stringify(response.user))
      }
    } catch {
      user.value = null
      token.value = null
      if (import.meta.client) {
        localStorage.removeItem('ocn-user')
      }
    } finally {
      loading.value = false
      initialized.value = true
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    initialized: readonly(initialized),
    hasRole,
    canAccess,
    isTechnician,
    isOwner,
    isAdmin,
    isViewer,
    login,
    logout,
    fetchUser,
  }
}
