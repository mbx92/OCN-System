<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold">Template Dokumen</h1>
        <p class="text-base-content/60">Kustomisasi template invoice dan quotation</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="text-center py-12">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div v-else class="space-y-6">
      <!-- Template Tabs -->
      <div class="tabs tabs-boxed w-fit">
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'invoice' }"
          @click="activeTab = 'invoice'"
        >
          Invoice
        </button>
        <button
          class="tab"
          :class="{ 'tab-active': activeTab === 'quotation' }"
          @click="activeTab = 'quotation'"
        >
          Quotation
        </button>
      </div>

      <!-- Invoice Template -->
      <div v-if="activeTab === 'invoice'" class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">Template Invoice</h2>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Settings -->
            <div class="space-y-4">
              <div>
                <label class="label">
                  <span class="label-text font-medium">Header Teks</span>
                </label>
                <input
                  v-model="invoiceTemplate.headerText"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="INVOICE"
                />
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Footer Teks</span>
                </label>
                <textarea
                  v-model="invoiceTemplate.footerText"
                  class="textarea textarea-bordered w-full"
                  rows="2"
                  placeholder="Terima kasih atas kepercayaan Anda."
                ></textarea>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Catatan Pembayaran</span>
                </label>
                <textarea
                  v-model="invoiceTemplate.paymentNotes"
                  class="textarea textarea-bordered w-full"
                  rows="3"
                  placeholder="Transfer ke rekening:&#10;BCA 1234567890 a.n. PT OCN Solutions"
                ></textarea>
              </div>

              <div class="flex gap-4">
                <label class="label cursor-pointer gap-2">
                  <input
                    v-model="invoiceTemplate.showLogo"
                    type="checkbox"
                    class="checkbox checkbox-sm checkbox-primary"
                  />
                  <span class="label-text">Tampilkan Logo</span>
                </label>
                <label class="label cursor-pointer gap-2">
                  <input
                    v-model="invoiceTemplate.showSignature"
                    type="checkbox"
                    class="checkbox checkbox-sm checkbox-primary"
                  />
                  <span class="label-text">Tampilkan Tanda Tangan</span>
                </label>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Warna Aksen</span>
                </label>
                <input v-model="invoiceTemplate.accentColor" type="color" class="w-20 h-10" />
              </div>
            </div>

            <!-- Preview -->
            <div class="border border-base-300 rounded-lg p-4 bg-white min-h-96">
              <div class="text-center">
                <p class="text-sm text-base-content/60">Preview</p>
                <div class="mt-4 text-left text-sm">
                  <div
                    class="border-b-4 pb-2 mb-4"
                    :style="{ borderColor: invoiceTemplate.accentColor }"
                  >
                    <h3 class="text-xl font-bold">{{ invoiceTemplate.headerText || 'INVOICE' }}</h3>
                    <p class="text-xs text-gray-500">No: INV-2024-0001</p>
                  </div>
                  <div class="space-y-2">
                    <p>
                      <strong>Kepada:</strong>
                      PT. Contoh
                    </p>
                    <p>
                      <strong>Tanggal:</strong>
                      {{ new Date().toLocaleDateString('id-ID') }}
                    </p>
                  </div>
                  <table class="w-full mt-4 text-xs">
                    <thead>
                      <tr
                        class="text-white"
                        :style="{ backgroundColor: invoiceTemplate.accentColor }"
                      >
                        <th class="text-left p-2">Item</th>
                        <th class="text-right p-2">Harga</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="border-b">
                        <td class="p-2">CCTV Hilook 4 Channel</td>
                        <td class="text-right p-2">Rp 2.500.000</td>
                      </tr>
                      <tr class="border-b">
                        <td class="p-2">Jasa Instalasi</td>
                        <td class="text-right p-2">Rp 500.000</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="mt-4 text-xs text-gray-600 whitespace-pre-line">
                    {{ invoiceTemplate.paymentNotes }}
                  </div>
                  <div class="mt-4 text-xs text-gray-500">
                    {{ invoiceTemplate.footerText }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-actions justify-end mt-4">
            <button @click="saveInvoiceTemplate" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-sm"></span>
              Simpan Template
            </button>
          </div>
        </div>
      </div>

      <!-- Quotation Template -->
      <div v-if="activeTab === 'quotation'" class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">Template Quotation/Penawaran</h2>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Settings -->
            <div class="space-y-4">
              <div>
                <label class="label">
                  <span class="label-text font-medium">Header Teks</span>
                </label>
                <input
                  v-model="quotationTemplate.headerText"
                  type="text"
                  class="input input-bordered w-full"
                  placeholder="SURAT PENAWARAN"
                />
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Pembuka</span>
                </label>
                <textarea
                  v-model="quotationTemplate.openingText"
                  class="textarea textarea-bordered w-full"
                  rows="2"
                  placeholder="Dengan hormat, bersama ini kami mengajukan penawaran harga untuk pekerjaan:"
                ></textarea>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Penutup</span>
                </label>
                <textarea
                  v-model="quotationTemplate.closingText"
                  class="textarea textarea-bordered w-full"
                  rows="2"
                  placeholder="Demikian penawaran ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih."
                ></textarea>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Syarat & Ketentuan</span>
                </label>
                <textarea
                  v-model="quotationTemplate.termsText"
                  class="textarea textarea-bordered w-full"
                  rows="3"
                  placeholder="1. Harga berlaku 14 hari&#10;2. Pembayaran DP 50%&#10;3. Garansi 1 tahun"
                ></textarea>
              </div>

              <div class="flex gap-4">
                <label class="label cursor-pointer gap-2">
                  <input
                    v-model="quotationTemplate.showLogo"
                    type="checkbox"
                    class="checkbox checkbox-sm checkbox-primary"
                  />
                  <span class="label-text">Tampilkan Logo</span>
                </label>
                <label class="label cursor-pointer gap-2">
                  <input
                    v-model="quotationTemplate.showSignature"
                    type="checkbox"
                    class="checkbox checkbox-sm checkbox-primary"
                  />
                  <span class="label-text">Tampilkan Tanda Tangan</span>
                </label>
              </div>

              <div>
                <label class="label">
                  <span class="label-text font-medium">Warna Aksen</span>
                </label>
                <input v-model="quotationTemplate.accentColor" type="color" class="w-20 h-10" />
              </div>
            </div>

            <!-- Preview -->
            <div class="border border-base-300 rounded-lg p-4 bg-white min-h-96">
              <div class="text-center">
                <p class="text-sm text-base-content/60">Preview</p>
                <div class="mt-4 text-left text-sm">
                  <div
                    class="border-b-4 pb-2 mb-4"
                    :style="{ borderColor: quotationTemplate.accentColor }"
                  >
                    <h3 class="text-xl font-bold">
                      {{ quotationTemplate.headerText || 'SURAT PENAWARAN' }}
                    </h3>
                    <p class="text-xs text-gray-500">No: QUO-2024-0001</p>
                  </div>
                  <p class="text-xs mb-4">{{ quotationTemplate.openingText }}</p>
                  <table class="w-full text-xs">
                    <thead>
                      <tr
                        class="text-white"
                        :style="{ backgroundColor: quotationTemplate.accentColor }"
                      >
                        <th class="text-left p-2">Item</th>
                        <th class="text-right p-2">Harga</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr class="border-b">
                        <td class="p-2">Paket CCTV 4 Kamera</td>
                        <td class="text-right p-2">Rp 3.000.000</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="mt-4 text-xs whitespace-pre-line">
                    {{ quotationTemplate.termsText }}
                  </div>
                  <p class="mt-4 text-xs">{{ quotationTemplate.closingText }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="card-actions justify-end mt-4">
            <button @click="saveQuotationTemplate" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-sm"></span>
              Simpan Template
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { showAlert } = useAlert()

const pending = ref(false)
const saving = ref(false)
const activeTab = ref<'invoice' | 'quotation'>('invoice')

// Store company data for updates
const companyData = ref<{ name: string; settings: Record<string, any> } | null>(null)

// Invoice template
const invoiceTemplate = reactive({
  headerText: 'INVOICE',
  footerText: 'Terima kasih atas kepercayaan Anda.',
  paymentNotes:
    'Transfer ke rekening:\nBCA 1234567890 a.n. PT OCN Solutions\nMandiri 0987654321 a.n. PT OCN Solutions',
  showLogo: true,
  showSignature: true,
  accentColor: '#1e40af',
})

// Quotation template
const quotationTemplate = reactive({
  headerText: 'SURAT PENAWARAN',
  openingText:
    'Dengan hormat, bersama ini kami mengajukan penawaran harga untuk pekerjaan sebagai berikut:',
  closingText:
    'Demikian penawaran ini kami sampaikan. Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.',
  termsText: '1. Harga berlaku 14 hari\n2. Pembayaran DP 50%\n3. Garansi 1 tahun',
  showLogo: true,
  showSignature: true,
  accentColor: '#1e40af',
})

// Load templates from company settings
onMounted(async () => {
  pending.value = true
  try {
    const company = await $fetch<any>('/api/company')
    companyData.value = company
    if (company?.settings?.invoiceTemplate) {
      Object.assign(invoiceTemplate, company.settings.invoiceTemplate)
    }
    if (company?.settings?.quotationTemplate) {
      Object.assign(quotationTemplate, company.settings.quotationTemplate)
    }
  } catch (e) {
    console.error('Failed to load templates:', e)
  } finally {
    pending.value = false
  }
})

const saveInvoiceTemplate = async () => {
  saving.value = true
  try {
    await $fetch('/api/company', {
      method: 'PUT',
      body: {
        name: companyData.value?.name || 'Company',
        settings: {
          ...companyData.value?.settings,
          invoiceTemplate: { ...invoiceTemplate },
        },
      },
    })
    showAlert('Template invoice berhasil disimpan', 'success')
  } catch {
    showAlert('Gagal menyimpan template', 'error')
  } finally {
    saving.value = false
  }
}

const saveQuotationTemplate = async () => {
  saving.value = true
  try {
    await $fetch('/api/company', {
      method: 'PUT',
      body: {
        name: companyData.value?.name || 'Company',
        settings: {
          ...companyData.value?.settings,
          quotationTemplate: { ...quotationTemplate },
        },
      },
    })
    showAlert('Template quotation berhasil disimpan', 'success')
  } catch {
    showAlert('Gagal menyimpan template', 'error')
  } finally {
    saving.value = false
  }
}
</script>
