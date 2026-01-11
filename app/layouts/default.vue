<template>
  <div class="drawer lg:drawer-open" data-theme="ocnlight">
    <!-- Drawer toggle for mobile -->
    <input id="main-drawer" type="checkbox" class="drawer-toggle" />

    <!-- Main content area -->
    <div class="drawer-content flex flex-col min-h-screen">
      <!-- Navbar -->
      <header
        class="navbar bg-base-100 border-b border-base-200 sticky top-0 z-40 no-print h-[73px] min-h-[73px]"
      >
        <!-- Desktop sidebar toggle -->
        <div class="flex-none hidden lg:block">
          <button @click="toggleSidebar" class="btn btn-square btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 6l16 0" />
              <path d="M4 12l16 0" />
              <path d="M4 18l16 0" />
            </svg>
          </button>
        </div>

        <!-- Mobile menu button -->
        <div class="flex-none lg:hidden">
          <label for="main-drawer" class="btn btn-square btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 6l16 0" />
              <path d="M4 12l16 0" />
              <path d="M4 18l16 0" />
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
            <svg
              v-if="isDark"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
              <path
                d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7"
              />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path
                d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"
              />
            </svg>
          </button>

          <!-- User dropdown -->
          <ClientOnly>
            <div v-if="user" class="dropdown dropdown-end">
              <label tabindex="0" class="btn btn-ghost btn-circle avatar placeholder">
                <div
                  class="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center"
                >
                  <span class="text-sm">{{ userInitials }}</span>
                </div>
              </label>
              <ul
                tabindex="0"
                class="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-52 mt-2"
              >
                <li class="menu-title">
                  <span>{{ user.name }}</span>
                </li>
                <li><a @click="navigateTo('/profile')">Profil</a></li>
                <li><a @click="handleLogout" class="text-error">Logout</a></li>
              </ul>
            </div>
            <template #fallback>
              <div class="w-10 h-10 rounded-full bg-base-300 animate-pulse"></div>
            </template>
          </ClientOnly>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-4 md:p-6 bg-base-200">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="footer footer-center p-4 bg-base-100 text-base-content no-print">
        <div>
          <ClientOnly>
            <p class="text-sm opacity-60">
              © {{ new Date().getFullYear() }} OCN System - CCTV & Networking Management
            </p>
            <template #fallback>
              <p class="text-sm opacity-60">© OCN System - CCTV & Networking Management</p>
            </template>
          </ClientOnly>
        </div>
      </footer>
    </div>

    <!-- Sidebar -->
    <aside class="drawer-side z-50">
      <label for="main-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
      <div
        :class="[
          'min-h-full bg-base-100 flex flex-col transition-all duration-300',
          isCollapsed ? 'w-16' : 'w-48',
        ]"
      >
        <!-- Sidebar header -->
        <div
          class="p-4 border-b border-base-200 h-[73px] min-h-[73px] flex items-center justify-center overflow-hidden"
        >
          <NuxtLink
            :to="user?.role === 'TECHNICIAN' ? '/technician' : '/dashboard'"
            :class="isCollapsed ? 'flex justify-center' : 'flex items-center gap-3 w-full'"
          >
            <img
              src="/logo.png"
              alt="OCN System"
              :class="isCollapsed ? 'h-8 w-8' : 'h-10 w-10'"
              class="object-contain shrink-0"
            />
            <div v-show="!isCollapsed" class="min-w-0 flex-1">
              <h1 class="text-lg font-bold text-primary truncate whitespace-nowrap">OCN System</h1>
              <p class="text-xs text-base-content/60 truncate whitespace-nowrap">
                CCTV & Networking
              </p>
            </div>
          </NuxtLink>
        </div>

        <!-- Navigation menu -->
        <nav class="flex-1 overflow-y-auto p-2">
          <ClientOnly>
            <!-- Technician Menu -->
            <ul
              v-if="user?.role === 'TECHNICIAN'"
              class="menu gap-1"
              :class="isCollapsed ? 'p-0' : ''"
            >
              <li>
                <NuxtLink
                  to="/technician"
                  class="flex items-center gap-3"
                  active-class="active"
                  :title="isCollapsed ? 'Dashboard' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  <span v-show="!isCollapsed">Dashboard</span>
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/technician/projects"
                  class="flex items-center gap-3"
                  active-class="active"
                  :title="isCollapsed ? 'Proyek Saya' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span v-show="!isCollapsed">Proyek Saya</span>
                </NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/technician/earnings"
                  class="flex items-center gap-3"
                  active-class="active"
                  :title="isCollapsed ? 'Pendapatan' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span v-show="!isCollapsed">Pendapatan</span>
                </NuxtLink>
              </li>
            </ul>

            <!-- Admin/Owner Menu -->
            <ul v-else class="menu gap-1" :class="isCollapsed ? 'p-0' : ''">
              <!-- Dashboard -->
              <li>
                <NuxtLink
                  to="/dashboard"
                  class="flex items-center gap-3"
                  active-class="active"
                  :title="isCollapsed ? 'Dashboard' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
                    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
                    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
                  </svg>
                  <span v-show="!isCollapsed">Dashboard</span>
                </NuxtLink>
              </li>

              <!-- Customers -->
              <li v-if="canAccess('customers.view')">
                <NuxtLink
                  to="/customers"
                  class="flex items-center gap-3"
                  active-class="active"
                  :title="isCollapsed ? 'Pelanggan' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                    <path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    <path d="M21 21v-2a4 4 0 0 0 -3 -3.85" />
                  </svg>
                  <span v-show="!isCollapsed">Pelanggan</span>
                </NuxtLink>
              </li>

              <!-- Quotations -->
              <li v-if="canAccess('quotations.view')">
                <NuxtLink
                  to="/quotations"
                  class="flex items-center gap-3"
                  active-class="active"
                  :title="isCollapsed ? 'Penawaran' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path
                      d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"
                    />
                    <path d="M9 9l1 0" />
                    <path d="M9 13l6 0" />
                    <path d="M9 17l6 0" />
                  </svg>
                  <span v-show="!isCollapsed">Penawaran</span>
                </NuxtLink>
              </li>

              <!-- Packages -->
              <li v-if="canAccess('quotations.view')">
                <NuxtLink
                  to="/packages"
                  class="flex items-center gap-3"
                  active-class="active"
                  :title="isCollapsed ? 'Paket' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
                    <path d="M12 12l8 -4.5" />
                    <path d="M12 12l0 9" />
                    <path d="M12 12l-8 -4.5" />
                    <path d="M8.2 9.8l7.6 -4.6" />
                    <path d="M15.8 9.8l-7.6 -4.6" />
                  </svg>
                  <span v-show="!isCollapsed">Paket</span>
                </NuxtLink>
              </li>

              <!-- Projects -->
              <li v-if="canAccess('projects.view.all') || canAccess('projects.view.assigned')">
                <NuxtLink
                  to="/projects"
                  class="flex items-center gap-3"
                  active-class="active"
                  :title="isCollapsed ? 'Proyek' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M12 3l8 4.5l0 9l-8 4.5l-8 -4.5l0 -9l8 -4.5" />
                    <path d="M12 12l8 -4.5" />
                    <path d="M12 12l0 9" />
                    <path d="M12 12l-8 -4.5" />
                  </svg>
                  <span v-show="!isCollapsed">Proyek</span>
                </NuxtLink>
              </li>

              <!-- Inventory submenu -->
              <li v-if="canAccess('inventory.view')">
                <details>
                  <summary class="flex items-center gap-3" :title="isCollapsed ? 'Inventori' : ''">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 flex-shrink-0"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path d="M3 21l18 0" />
                      <path
                        d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4"
                      />
                      <path d="M5 21l0 -10.15" />
                      <path d="M19 21l0 -10.15" />
                      <path d="M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4" />
                    </svg>
                    <span v-show="!isCollapsed">Inventori</span>
                  </summary>
                  <ul v-show="!isCollapsed">
                    <li>
                      <NuxtLink to="/inventory/products" active-class="active">Produk</NuxtLink>
                    </li>
                    <li><NuxtLink to="/inventory/stock" active-class="active">Stok</NuxtLink></li>
                    <li>
                      <NuxtLink to="/inventory/stock-opname" active-class="active">
                        Stock Opname
                      </NuxtLink>
                    </li>
                  </ul>
                </details>
              </li>

              <!-- Purchase Orders -->
              <li v-if="canAccess('po.view')">
                <NuxtLink
                  to="/purchase-orders"
                  class="flex items-center gap-3"
                  active-class="active"
                  :title="isCollapsed ? 'Purchase Order' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M6 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                    <path d="M17 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
                    <path d="M17 17h-11v-14h-2" />
                    <path d="M6 5l14 1l-1 7h-13" />
                  </svg>
                  <span v-show="!isCollapsed">Purchase Order</span>
                </NuxtLink>
              </li>

              <!-- Suppliers -->
              <li v-if="canAccess('po.view')">
                <NuxtLink
                  to="/suppliers"
                  class="flex items-center gap-3"
                  active-class="active"
                  :title="isCollapsed ? 'Suppliers' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M3 21l18 0" />
                    <path d="M9 8l1 0" />
                    <path d="M9 12l1 0" />
                    <path d="M9 16l1 0" />
                    <path d="M14 8l1 0" />
                    <path d="M14 12l1 0" />
                    <path d="M14 16l1 0" />
                    <path d="M5 21v-16a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v16" />
                  </svg>
                  <span v-show="!isCollapsed">Suppliers</span>
                </NuxtLink>
              </li>

              <!-- Finance submenu -->
              <li v-if="canAccess('finance.view.all')">
                <details>
                  <summary class="flex items-center gap-3" :title="isCollapsed ? 'Keuangan' : ''">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 flex-shrink-0"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path
                        d="M16.7 8a3 3 0 0 0 -2.7 -2h-4a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-4a3 3 0 0 1 -2.7 -2"
                      />
                      <path d="M12 3v3m0 12v3" />
                    </svg>
                    <span v-show="!isCollapsed">Keuangan</span>
                  </summary>
                  <ul v-show="!isCollapsed">
                    <li>
                      <NuxtLink to="/finance/payments" active-class="active">
                        Pembayaran & Invoice
                      </NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/finance/expenses" active-class="active">Pengeluaran</NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/finance/assets" active-class="active">Asset</NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/finance/technician-payments" active-class="active">
                        Pembayaran Teknisi
                      </NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/finance/profit" active-class="active">
                        Analisis Profit
                      </NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/finance/cashflow" active-class="active">Cashflow</NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/finance/cash-advances" active-class="active">
                        Kas Bon Teknisi
                      </NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/finance/bonuses" active-class="active">Bonus Teknisi</NuxtLink>
                    </li>
                    <li>
                      <details>
                        <summary>Laporan</summary>
                        <ul>
                          <li>
                            <NuxtLink to="/finance/reports/sales" active-class="active">
                              Penjualan
                            </NuxtLink>
                          </li>
                          <li>
                            <NuxtLink to="/finance/reports/purchases" active-class="active">
                              Pembelian
                            </NuxtLink>
                          </li>
                          <li>
                            <NuxtLink to="/finance/reports/expenses" active-class="active">
                              Pengeluaran
                            </NuxtLink>
                          </li>
                          <li>
                            <NuxtLink to="/finance/reports/inventory" active-class="active">
                              Inventory
                            </NuxtLink>
                          </li>
                          <li>
                            <NuxtLink to="/finance/reports/profit-loss" active-class="active">
                              Laba Rugi
                            </NuxtLink>
                          </li>
                          <li>
                            <NuxtLink
                              to="/finance/reports/technician-payments"
                              active-class="active"
                            >
                              Pembayaran Teknisi
                            </NuxtLink>
                          </li>
                        </ul>
                      </details>
                    </li>
                  </ul>
                </details>
              </li>

              <!-- Maintenance -->
              <li v-if="canAccess('projects.view.all')">
                <details>
                  <summary
                    class="flex items-center gap-3"
                    :title="isCollapsed ? 'Maintenance' : ''"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 flex-shrink-0"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path
                        d="M7 10h3v-3l-3.5 -3.5a6 6 0 0 1 8 8l6 6a2 2 0 0 1 -3 3l-6 -6a6 6 0 0 1 -8 -8l3.5 3.5"
                      />
                    </svg>
                    <span v-show="!isCollapsed">Maintenance</span>
                  </summary>
                  <ul v-show="!isCollapsed">
                    <li>
                      <NuxtLink to="/maintenance/warranty" active-class="active">Garansi</NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/maintenance/schedule" active-class="active">Jadwal</NuxtLink>
                    </li>
                  </ul>
                </details>
              </li>

              <!-- Rekap Pembayaran (for TECHNICIAN role) -->
              <li v-if="user?.role === 'TECHNICIAN'">
                <NuxtLink
                  to="/technician/payments"
                  class="flex items-center gap-3"
                  active-class="active"
                  :title="isCollapsed ? 'Rekap Pembayaran' : ''"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5 flex-shrink-0"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    stroke-width="2"
                    stroke="currentColor"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                    <path
                      d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"
                    />
                    <path d="M9 7l1 0" />
                    <path d="M9 13l6 0" />
                    <path d="M9 17l3 0" />
                  </svg>
                  <span v-show="!isCollapsed">Rekap Pembayaran</span>
                </NuxtLink>
              </li>

              <div v-show="!isCollapsed" class="divider my-2"></div>

              <!-- Settings -->
              <li v-if="canAccess('settings.view')">
                <details>
                  <summary class="flex items-center gap-3" :title="isCollapsed ? 'Pengaturan' : ''">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 flex-shrink-0"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                      stroke="currentColor"
                      fill="none"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                      <path
                        d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"
                      />
                      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                    </svg>
                    <span v-show="!isCollapsed">Pengaturan</span>
                  </summary>
                  <ul v-show="!isCollapsed">
                    <li>
                      <NuxtLink to="/settings/company" active-class="active">Perusahaan</NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/settings/users" active-class="active">Pengguna</NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/settings/units" active-class="active">Master Satuan</NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/settings/technicians" active-class="active">Teknisi</NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/settings/templates" active-class="active">Template</NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/settings/integrations" active-class="active">
                        Integrasi
                      </NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/settings/activity-logs" active-class="active">
                        Activity Logs
                      </NuxtLink>
                    </li>
                    <li>
                      <NuxtLink to="/settings/utilities" active-class="active">Utilitas</NuxtLink>
                    </li>
                  </ul>
                </details>
              </li>
            </ul>
            <template #fallback>
              <ul class="menu gap-1" :class="isCollapsed ? 'p-0' : ''">
                <li v-for="i in 6" :key="i">
                  <div class="h-10 bg-base-300 animate-pulse rounded-lg"></div>
                </li>
              </ul>
            </template>
          </ClientOnly>
        </nav>

        <!-- User info at bottom -->
        <ClientOnly>
          <div v-if="user && !isCollapsed" class="p-4 border-t border-base-200">
            <div class="flex items-center gap-3">
              <div class="avatar placeholder">
                <div
                  class="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center"
                >
                  <span class="text-sm">{{ userInitials }}</span>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">{{ user.name }}</p>
                <p class="text-xs text-base-content/60">{{ roleLabel }}</p>
              </div>
            </div>
          </div>
        </ClientOnly>
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
          <button @click="dismissAlert(alert.id)" class="btn btn-ghost btn-sm btn-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              stroke-width="2"
              stroke="currentColor"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M18 6l-12 12" />
              <path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>

    <!-- PWA Install Prompt -->
    <PwaInstallPrompt />
  </div>
</template>

<script setup lang="ts">
const { user, canAccess, logout } = useAuth()
const { alerts, dismiss: dismissAlert } = useAlert()

const isDark = ref(false)
const isCollapsed = ref(false)

const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
}

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
