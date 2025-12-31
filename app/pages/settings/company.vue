<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Pengaturan Perusahaan</h1>
        <p class="text-base-content/60">Kelola informasi dan pengaturan perusahaan</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pending" class="text-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Settings Form -->
    <form v-else @submit.prevent="saveSettings" class="space-y-6">
      <!-- Company Information -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            Informasi Perusahaan
          </h2>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-4">
            <!-- Left Column -->
            <div class="space-y-4">
              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">
                    Nama Perusahaan
                    <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="Nama perusahaan"
                  required
                />
              </div>

              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">Telepon</span>
                </label>
                <input
                  v-model="form.settings.phone"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="08xx-xxxx-xxxx"
                />
              </div>

              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">Website</span>
                </label>
                <input
                  v-model="form.settings.website"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="https://www.perusahaan.com"
                />
              </div>
            </div>

            <!-- Right Column -->
            <div class="space-y-4">
              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">Email</span>
                </label>
                <input
                  v-model="form.settings.email"
                  type="email"
                  class="input input-bordered w-full"
                  placeholder="email@perusahaan.com"
                />
              </div>

              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">NPWP</span>
                </label>
                <input
                  v-model="form.settings.taxId"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="00.000.000.0-000.000"
                />
              </div>
            </div>

            <!-- Full Width - Address -->
            <div class="form-control lg:col-span-2">
              <label class="label py-1">
                <span class="label-text font-medium">Alamat</span>
              </label>
              <textarea
                v-model="form.settings.address"
                class="textarea textarea-bordered w-full"
                rows="2"
                placeholder="Alamat lengkap perusahaan"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- Bank Information -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            Informasi Bank
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-medium">Nama Bank</span>
              </label>
              <input
                v-model="form.settings.bankName"
                type="text"
                class="input input-bordered w-full"
                placeholder="BCA, Mandiri, BRI, dll"
              />
            </div>

            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-medium">Nomor Rekening</span>
              </label>
              <input
                v-model="form.settings.bankAccount"
                type="text"
                class="input input-bordered w-full"
                placeholder="1234567890"
              />
            </div>

            <div class="form-control">
              <label class="label py-1">
                <span class="label-text font-medium">Atas Nama</span>
              </label>
              <input
                v-model="form.settings.bankAccountName"
                type="text"
                class="input input-bordered w-full"
                placeholder="Nama pemilik rekening"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Document Settings & Default Settings Combined -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Document Settings -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title text-lg mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Prefix Dokumen
            </h2>

            <div class="grid grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">Invoice</span>
                </label>
                <input
                  v-model="form.settings.invoicePrefix"
                  type="text"
                  class="input input-bordered input-sm w-full"
                  placeholder="INV"
                />
              </div>

              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">Quotation</span>
                </label>
                <input
                  v-model="form.settings.quotationPrefix"
                  type="text"
                  class="input input-bordered input-sm w-full"
                  placeholder="QUO"
                />
              </div>

              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">Proyek</span>
                </label>
                <input
                  v-model="form.settings.projectPrefix"
                  type="text"
                  class="input input-bordered input-sm w-full"
                  placeholder="PRJ"
                />
              </div>

              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">Purchase Order</span>
                </label>
                <input
                  v-model="form.settings.purchaseOrderPrefix"
                  type="text"
                  class="input input-bordered input-sm w-full"
                  placeholder="PO"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Default Settings -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title text-lg mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Pengaturan Default
            </h2>

            <div class="space-y-4">
              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">Termin Pembayaran</span>
                  <span class="label-text-alt">hari</span>
                </label>
                <input
                  v-model.number="form.settings.defaultPaymentTerms"
                  type="number"
                  min="0"
                  class="input input-bordered input-sm w-full"
                  placeholder="14"
                />
              </div>

              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">Masa Berlaku Quotation</span>
                  <span class="label-text-alt">hari</span>
                </label>
                <input
                  v-model.number="form.settings.defaultQuotationValidity"
                  type="number"
                  min="0"
                  class="input input-bordered input-sm w-full"
                  placeholder="30"
                />
              </div>

              <div class="form-control">
                <label class="label py-1">
                  <span class="label-text font-medium">Persentase Kas Usaha</span>
                  <span class="label-text-alt">%</span>
                </label>
                <input
                  v-model.number="form.settings.businessCashPercentage"
                  type="number"
                  min="0"
                  max="100"
                  class="input input-bordered input-sm w-full"
                  placeholder="30"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Logo Upload -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Logo Perusahaan
          </h2>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Logo Preview -->
            <div class="flex flex-col items-center gap-3">
              <div
                class="w-32 h-32 border-2 border-dashed border-base-300 rounded-lg flex items-center justify-center bg-base-200 overflow-hidden"
              >
                <img
                  v-if="form.settings.logo"
                  :src="form.settings.logo"
                  alt="Logo"
                  class="max-w-full max-h-full object-contain"
                />
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-12 w-12 text-base-content/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <button
                v-if="form.settings.logo"
                type="button"
                @click="form.settings.logo = ''"
                class="btn btn-ghost btn-xs text-error gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Hapus Logo
              </button>
              <p v-else class="text-xs text-base-content/50">Preview Logo</p>
            </div>

            <!-- Upload File -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Upload dari File</span>
              </label>
              <input
                type="file"
                accept="image/*"
                @change="handleLogoUpload"
                class="file-input file-input-bordered w-full"
              />
              <label class="label">
                <span class="label-text-alt text-base-content/60">
                  Format: PNG, JPG. Maks: 500KB
                </span>
              </label>
            </div>

            <!-- URL / Base64 -->
            <div class="form-control">
              <label class="label">
                <span class="label-text font-medium">Atau URL / Base64</span>
              </label>
              <input
                v-model="form.settings.logo"
                type="text"
                class="input input-bordered w-full"
                placeholder="https://... atau data:image/..."
              />
              <label class="label">
                <span class="label-text-alt text-base-content/60">
                  Masukkan URL gambar atau string base64
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Signature Upload -->
      <div class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title text-lg mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Tanda Tangan Digital
          </h2>

          <!-- Tabs for signature input method -->
          <div class="tabs tabs-boxed mb-4 w-fit">
            <button
              type="button"
              class="tab"
              :class="{ 'tab-active': signatureTab === 'canvas' }"
              @click="signatureTab = 'canvas'"
            >
              Gambar Langsung
            </button>
            <button
              type="button"
              class="tab"
              :class="{ 'tab-active': signatureTab === 'upload' }"
              @click="signatureTab = 'upload'"
            >
              Upload File
            </button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Left: Canvas or Upload -->
            <div>
              <!-- Canvas Mode -->
              <div v-if="signatureTab === 'canvas'" class="space-y-3">
                <label class="label py-0">
                  <span class="label-text font-medium">Gambar tanda tangan di area ini:</span>
                </label>
                <div class="border-2 border-base-300 rounded-lg bg-white relative">
                  <canvas
                    ref="signatureCanvas"
                    width="400"
                    height="150"
                    class="w-full cursor-crosshair touch-none"
                    @mousedown="startDrawing"
                    @mousemove="draw"
                    @mouseup="stopDrawing"
                    @mouseleave="stopDrawing"
                    @touchstart.prevent="startDrawingTouch"
                    @touchmove.prevent="drawTouch"
                    @touchend="stopDrawing"
                  ></canvas>
                </div>
                <div class="flex gap-2">
                  <button type="button" @click="clearCanvas" class="btn btn-outline btn-sm gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Hapus
                  </button>
                  <button
                    type="button"
                    @click="applyCanvasSignature"
                    class="btn btn-primary btn-sm gap-1"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Terapkan
                  </button>
                </div>
                <p class="text-xs text-base-content/60">
                  Gunakan mouse atau sentuh layar untuk menggambar tanda tangan
                </p>
              </div>

              <!-- Upload Mode -->
              <div v-else class="space-y-4">
                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">Upload dari File</span>
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    @change="handleSignatureUpload"
                    class="file-input file-input-bordered w-full"
                  />
                  <label class="label">
                    <span class="label-text-alt text-base-content/60">
                      Format: PNG dengan transparansi lebih baik
                    </span>
                  </label>
                </div>

                <div class="divider my-0">atau</div>

                <div class="form-control">
                  <label class="label">
                    <span class="label-text font-medium">URL / Base64</span>
                  </label>
                  <input
                    v-model="form.settings.signature"
                    type="text"
                    class="input input-bordered w-full"
                    placeholder="https://... atau data:image/..."
                  />
                </div>
              </div>
            </div>

            <!-- Right: Preview -->
            <div class="flex flex-col items-center gap-3">
              <label class="label py-0">
                <span class="label-text font-medium">Preview Tanda Tangan:</span>
              </label>
              <div
                class="w-full max-w-xs h-32 border-2 border-dashed border-base-300 rounded-lg flex items-center justify-center bg-base-200 overflow-hidden"
              >
                <img
                  v-if="form.settings.signature"
                  :src="form.settings.signature"
                  alt="Signature"
                  class="max-w-full max-h-full object-contain"
                />
                <div v-else class="text-center text-base-content/30">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-10 w-10 mx-auto mb-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  <p class="text-xs">Belum ada tanda tangan</p>
                </div>
              </div>
              <button
                v-if="form.settings.signature"
                type="button"
                @click="form.settings.signature = ''"
                class="btn btn-ghost btn-xs text-error gap-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Hapus Tanda Tangan
              </button>
              <p class="text-xs text-base-content/60 text-center">
                Tanda tangan akan muncul di Invoice &amp; Kwitansi
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Button -->
      <div
        class="flex justify-end gap-2 sticky bottom-4 bg-base-100/80 backdrop-blur-sm p-4 rounded-lg shadow-lg"
      >
        <button type="button" @click="resetForm" class="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Reset
        </button>
        <button type="submit" class="btn btn-primary" :disabled="saving">
          <span v-if="saving" class="loading loading-spinner loading-sm"></span>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          {{ saving ? 'Menyimpan...' : 'Simpan Pengaturan' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const { showAlert } = useAlert()

const saving = ref(false)

// Signature canvas
const signatureTab = ref<'canvas' | 'upload'>('canvas')
const signatureCanvas = ref<HTMLCanvasElement | null>(null)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

interface CompanySettings {
  address: string
  phone: string
  email: string
  website: string
  taxId: string
  bankName: string
  bankAccount: string
  bankAccountName: string
  logo: string
  signature: string
  invoicePrefix: string
  quotationPrefix: string
  projectPrefix: string
  purchaseOrderPrefix: string
  defaultPaymentTerms: number
  defaultQuotationValidity: number
  businessCashPercentage: number
}

interface Company {
  id: string
  name: string
  settings: CompanySettings
}

const { data: company, pending, refresh } = await useFetch<Company>('/api/company')

const defaultSettings: CompanySettings = {
  address: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
  bankName: '',
  bankAccount: '',
  bankAccountName: '',
  logo: '',
  signature: '',
  invoicePrefix: 'INV',
  quotationPrefix: 'QUO',
  projectPrefix: 'PRJ',
  purchaseOrderPrefix: 'PO',
  defaultPaymentTerms: 14,
  defaultQuotationValidity: 30,
  businessCashPercentage: 30,
}

const form = reactive({
  name: '',
  settings: { ...defaultSettings },
})

// Populate form when data is loaded
watch(
  company,
  data => {
    if (data) {
      form.name = data.name || ''
      form.settings = {
        ...defaultSettings,
        ...(data.settings as CompanySettings),
      }
    }
  },
  { immediate: true }
)

const handleLogoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Check file size (max 500KB)
  if (file.size > 500 * 1024) {
    showAlert('Ukuran file terlalu besar. Maksimal 500KB', 'error')
    return
  }

  const reader = new FileReader()
  reader.onload = e => {
    form.settings.logo = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const handleSignatureUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // Check file size (max 500KB)
  if (file.size > 500 * 1024) {
    showAlert('Ukuran file terlalu besar. Maksimal 500KB', 'error')
    return
  }

  const reader = new FileReader()
  reader.onload = e => {
    form.settings.signature = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

// Canvas drawing functions
const getCanvasContext = () => {
  if (!signatureCanvas.value) return null
  return signatureCanvas.value.getContext('2d')
}

const initCanvas = () => {
  const ctx = getCanvasContext()
  if (!ctx) return
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
}

const startDrawing = (e: MouseEvent) => {
  const canvas = signatureCanvas.value
  if (!canvas) return

  isDrawing.value = true
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  lastX.value = (e.clientX - rect.left) * scaleX
  lastY.value = (e.clientY - rect.top) * scaleY
}

const draw = (e: MouseEvent) => {
  if (!isDrawing.value) return
  const canvas = signatureCanvas.value
  const ctx = getCanvasContext()
  if (!canvas || !ctx) return

  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY

  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(x, y)
  ctx.stroke()

  lastX.value = x
  lastY.value = y
}

const stopDrawing = () => {
  isDrawing.value = false
}

const startDrawingTouch = (e: TouchEvent) => {
  const canvas = signatureCanvas.value
  if (!canvas || e.touches.length === 0) return

  isDrawing.value = true
  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  lastX.value = (touch.clientX - rect.left) * scaleX
  lastY.value = (touch.clientY - rect.top) * scaleY
}

const drawTouch = (e: TouchEvent) => {
  if (!isDrawing.value || e.touches.length === 0) return
  const canvas = signatureCanvas.value
  const ctx = getCanvasContext()
  if (!canvas || !ctx) return

  const rect = canvas.getBoundingClientRect()
  const touch = e.touches[0]
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (touch.clientX - rect.left) * scaleX
  const y = (touch.clientY - rect.top) * scaleY

  ctx.beginPath()
  ctx.moveTo(lastX.value, lastY.value)
  ctx.lineTo(x, y)
  ctx.stroke()

  lastX.value = x
  lastY.value = y
}

const clearCanvas = () => {
  const canvas = signatureCanvas.value
  const ctx = getCanvasContext()
  if (!canvas || !ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)
}

const applyCanvasSignature = () => {
  const canvas = signatureCanvas.value
  if (!canvas) return

  // Check if canvas is empty
  const ctx = getCanvasContext()
  if (!ctx) return

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const isEmpty = !imageData.data.some((channel, index) => {
    // Check alpha channel (every 4th value starting from index 3)
    return index % 4 === 3 && channel !== 0
  })

  if (isEmpty) {
    showAlert('Silakan gambar tanda tangan terlebih dahulu', 'warning')
    return
  }

  // Convert canvas to base64 PNG
  form.settings.signature = canvas.toDataURL('image/png')
  showAlert('Tanda tangan berhasil diterapkan!', 'success')
}

// Initialize canvas when tab changes to canvas
watch(signatureTab, newTab => {
  if (newTab === 'canvas') {
    nextTick(() => {
      initCanvas()
    })
  }
})

// Initialize canvas on mount
onMounted(() => {
  nextTick(() => {
    initCanvas()
  })
})

const resetForm = () => {
  if (company.value) {
    form.name = company.value.name || ''
    form.settings = {
      ...defaultSettings,
      ...(company.value.settings as CompanySettings),
    }
  }
}

const saveSettings = async () => {
  if (!form.name) {
    showAlert('Nama perusahaan wajib diisi', 'error')
    return
  }

  saving.value = true
  try {
    await $fetch('/api/company', {
      method: 'PUT',
      body: form,
    })
    showAlert('Pengaturan berhasil disimpan!', 'success')
    await refresh()
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan pengaturan', 'error')
  } finally {
    saving.value = false
  }
}
</script>
