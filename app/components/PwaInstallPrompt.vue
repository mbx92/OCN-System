<script setup lang="ts">
// PWA Install Prompt Component
// Uses native beforeinstallprompt event for better compatibility

const showPrompt = ref(false)
const dismissed = ref(false)
const deferredPrompt = ref<any>(null)

// Check if already dismissed in this session
onMounted(() => {
  // Check sessionStorage
  const wasDismissed = sessionStorage.getItem('pwa-prompt-dismissed')
  if (wasDismissed) {
    dismissed.value = true
  }

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    dismissed.value = true
    return
  }

  // Listen for beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault()
    // Stash the event so it can be triggered later
    deferredPrompt.value = e
    // Show our custom prompt if not dismissed
    if (!dismissed.value) {
      showPrompt.value = true
    }
  })

  // Listen for successful install
  window.addEventListener('appinstalled', () => {
    showPrompt.value = false
    deferredPrompt.value = null
    console.log('PWA was installed')
  })
})

const installPwa = async () => {
  if (!deferredPrompt.value) {
    console.log('No deferred prompt available')
    return
  }

  // Show the browser's install prompt
  deferredPrompt.value.prompt()

  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.value.userChoice
  console.log(`User response to the install prompt: ${outcome}`)

  // Clear the deferred prompt
  deferredPrompt.value = null
  showPrompt.value = false
}

const dismissPrompt = () => {
  showPrompt.value = false
  dismissed.value = true
  sessionStorage.setItem('pwa-prompt-dismissed', 'true')
}
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-full"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-full"
      >
        <div
          v-if="showPrompt"
          class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100]"
        >
          <div class="card bg-base-100 shadow-2xl border border-base-300">
            <div class="card-body p-4">
              <!-- Header -->
              <div class="flex items-start gap-4">
                <!-- App Icon -->
                <div class="avatar">
                  <div class="w-14 h-14 rounded-xl bg-primary/10 p-2">
                    <img src="/logo.png" alt="OCN System" class="w-full h-full object-contain" />
                  </div>
                </div>

                <!-- Content -->
                <div class="flex-1">
                  <h3 class="font-bold text-lg">Install OCN System</h3>
                  <p class="text-sm text-base-content/70">
                    Pasang aplikasi untuk akses lebih cepat dan pengalaman seperti native app.
                  </p>
                </div>

                <!-- Close button -->
                <button
                  @click="dismissPrompt"
                  class="btn btn-ghost btn-sm btn-circle"
                  aria-label="Tutup"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M18 6l-12 12" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Features -->
              <div class="flex flex-wrap gap-2 mt-2">
                <span class="badge badge-sm badge-ghost">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M5 12l5 5l10 -10" />
                  </svg>
                  Akses Offline
                </span>
                <span class="badge badge-sm badge-ghost">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M5 12l5 5l10 -10" />
                  </svg>
                  Lebih Cepat
                </span>
                <span class="badge badge-sm badge-ghost">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-3 w-3 mr-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M5 12l5 5l10 -10" />
                  </svg>
                  Fullscreen
                </span>
              </div>

              <!-- Actions -->
              <div class="card-actions justify-end mt-3">
                <button @click="dismissPrompt" class="btn btn-ghost btn-sm">Nanti saja</button>
                <button @click="installPwa" class="btn btn-primary btn-sm gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
                    <path d="M7 11l5 5l5 -5" />
                    <path d="M12 4l0 12" />
                  </svg>
                  Install
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
