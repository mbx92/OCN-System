<template>
  <div class="drawer lg:drawer-open" data-theme="ocnlight">
    <!-- Drawer toggle for mobile -->
    <input id="main-drawer" type="checkbox" class="drawer-toggle" />
    
    <!-- Main content area -->
    <div class="drawer-content flex flex-col min-h-screen">
      <!-- Navbar -->
      <header class="navbar bg-base-100 shadow-sm sticky top-0 z-40 no-print">
        <!-- Mobile menu button -->
        <div class="flex-none lg:hidden">
          <label for="main-drawer" class="btn btn-square btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
        </div>
        
        <!-- Logo/Title -->
        <div class="flex-1">
          <span class="text-xl font-bold text-primary lg:hidden">OCN System</span>
        </div>
        
        <!-- Right side items -->
        <div class="flex-none gap-2">
          <!-- Theme toggle -->
          <button @click="toggleTheme" class="btn btn-ghost btn-circle">
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
          
          <!-- User dropdown -->
          <div v-if="user" class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-ghost btn-circle avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-10">
                <span class="text-sm">{{ userInitials }}</span>
              </div>
            </label>
            <ul tabindex="0" class="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52 mt-2">
              <li class="menu-title">
                <span>{{ user.name }}</span>
              </li>
              <li><a @click="navigateTo('/profile')">Profil</a></li>
              <li><a @click="handleLogout" class="text-error">Logout</a></li>
            </ul>
          </div>
        </div>
      </header>
      
      <!-- Page content -->
      <main class="flex-1 p-4 md:p-6 bg-base-200">
        <slot />
      </main>
      
      <!-- Footer -->
      <footer class="footer footer-center p-4 bg-base-100 text-base-content no-print">
        <div>
          <p class="text-sm opacity-60">© {{ new Date().getFullYear() }} OCN System - CCTV & Networking Management</p>
        </div>
      </footer>
    </div>
    
    <!-- Sidebar -->
    <aside class="drawer-side z-50">
      <label for="main-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <div class="w-72 min-h-full bg-base-100 flex flex-col">
        <!-- Sidebar header -->
        <div class="p-4 border-b border-base-200">
          <NuxtLink to="/dashboard" class="flex items-center gap-3">
            <div class="bg-primary text-primary-content rounded-lg p-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 class="text-lg font-bold text-primary">OCN System</h1>
              <p class="text-xs text-base-content/60">CCTV & Networking</p>
            </div>
          </NuxtLink>
        </div>
        
        <!-- Navigation menu -->
        <nav class="flex-1 overflow-y-auto p-4">
          <ul class="menu menu-lg gap-1">
            <!-- Dashboard -->
            <li>
              <NuxtLink to="/dashboard" class="flex items-center gap-3" active-class="active">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </NuxtLink>
            </li>
            
            <!-- Customers -->
            <li v-if="canAccess('customers.view')">
              <NuxtLink to="/customers" class="flex items-center gap-3" active-class="active">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Pelanggan
              </NuxtLink>
            </li>
            
            <!-- Quotations -->
            <li v-if="canAccess('quotations.view')">
              <NuxtLink to="/quotations" class="flex items-center gap-3" active-class="active">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Penawaran
              </NuxtLink>
            </li>
            
            <!-- Projects -->
            <li v-if="canAccess('projects.view.all') || canAccess('projects.view.assigned')">
              <NuxtLink to="/projects" class="flex items-center gap-3" active-class="active">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Proyek
              </NuxtLink>
            </li>
            
            <!-- Inventory submenu -->
            <li v-if="canAccess('inventory.view')">
              <details>
                <summary class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Inventori
                </summary>
                <ul>
                  <li><NuxtLink to="/inventory/products" active-class="active">Produk</NuxtLink></li>
                  <li><NuxtLink to="/inventory/stock" active-class="active">Stok</NuxtLink></li>
                  <li><NuxtLink to="/inventory/suppliers" active-class="active">Supplier</NuxtLink></li>
                </ul>
              </details>
            </li>
            
            <!-- Purchase Orders -->
            <li v-if="canAccess('po.view')">
              <NuxtLink to="/purchases" class="flex items-center gap-3" active-class="active">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Purchase Order
              </NuxtLink>
            </li>
            
            <!-- Finance submenu -->
            <li v-if="canAccess('finance.view.all')">
              <details>
                <summary class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Keuangan
                </summary>
                <ul>
                  <li><NuxtLink to="/finance/payments" active-class="active">Pembayaran</NuxtLink></li>
                  <li><NuxtLink to="/finance/expenses" active-class="active">Pengeluaran</NuxtLink></li>
                  <li><NuxtLink to="/finance/reports" active-class="active">Laporan</NuxtLink></li>
                </ul>
              </details>
            </li>
            
            <!-- Maintenance -->
            <li v-if="canAccess('projects.view.all')">
              <details>
                <summary class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Maintenance
                </summary>
                <ul>
                  <li><NuxtLink to="/maintenance/warranty" active-class="active">Garansi</NuxtLink></li>
                  <li><NuxtLink to="/maintenance/schedule" active-class="active">Jadwal</NuxtLink></li>
                </ul>
              </details>
            </li>
            
            <div class="divider my-2"></div>
            
            <!-- Settings -->
            <li v-if="canAccess('settings.view')">
              <details>
                <summary class="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Pengaturan
                </summary>
                <ul>
                  <li><NuxtLink to="/settings/company" active-class="active">Perusahaan</NuxtLink></li>
                  <li><NuxtLink to="/settings/technicians" active-class="active">Teknisi</NuxtLink></li>
                  <li><NuxtLink to="/settings/templates" active-class="active">Template</NuxtLink></li>
                </ul>
              </details>
            </li>
            
            <!-- Users -->
            <li v-if="canAccess('users.view')">
              <NuxtLink to="/users" class="flex items-center gap-3" active-class="active">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                User Management
              </NuxtLink>
            </li>
          </ul>
        </nav>
        
        <!-- User info at bottom -->
        <div v-if="user" class="p-4 border-t border-base-200">
          <div class="flex items-center gap-3">
            <div class="avatar placeholder">
              <div class="bg-primary text-primary-content rounded-full w-10">
                <span class="text-sm">{{ userInitials }}</span>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">{{ user.name }}</p>
              <p class="text-xs text-base-content/60">{{ roleLabel }}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
    
    <!-- Alert container -->
    <div class="toast toast-top toast-end z-[100]">
      <TransitionGroup name="alert">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="alert shadow-lg"
          :class="{
            'alert-success': alert.type === 'success',
            'alert-error': alert.type === 'error',
            'alert-warning': alert.type === 'warning',
            'alert-info': alert.type === 'info',
          }"
        >
          <span>{{ alert.message }}</span>
          <button @click="dismissAlert(alert.id)" class="btn btn-ghost btn-sm btn-circle">✕</button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, canAccess, logout } = useAuth()
const { alerts, dismiss: dismissAlert } = useAlert()

const isDark = ref(false)

const userInitials = computed(() => {
  if (!user.value?.name) return '?'
  return user.value.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const roleLabel = computed(() => {
  const labels: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Administrator',
    TECHNICIAN: 'Teknisi',
    VIEWER: 'Viewer',
  }
  return labels[user.value?.role || ''] || user.value?.role
})

const toggleTheme = () => {
  isDark.value = !isDark.value
  const drawer = document.querySelector('.drawer')
  if (drawer) {
    drawer.setAttribute('data-theme', isDark.value ? 'ocndark' : 'ocnlight')
  }
}

const handleLogout = async () => {
  await logout()
}
</script>

<style scoped>
.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.alert-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
