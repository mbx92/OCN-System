<template>
  <div class="space-y-6">
    <!-- Back Button -->
    <button @click="navigateTo('/inventory/products')" class="btn btn-ghost btn-sm gap-2">
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
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Kembali
    </button>

    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Edit Produk</h1>
    </div>

    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <form @submit.prevent="saveProduct">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- SKU -->
            <div>
              <label class="block text-sm font-medium mb-2">Kode SKU *</label>
              <input v-model="form.sku" type="text" class="input input-bordered w-full" required />
            </div>

            <!-- Name -->
            <div>
              <label class="block text-sm font-medium mb-2">Nama Produk *</label>
              <input v-model="form.name" type="text" class="input input-bordered w-full" required />
            </div>

            <!-- Category -->
            <div>
              <label class="block text-sm font-medium mb-2">Kategori *</label>
              <select v-model="form.category" class="select select-bordered w-full" required>
                <option value="">Pilih Kategori</option>
                <option value="CCTV">CCTV</option>
                <option value="NETWORK">Network</option>
                <option value="ACCESSORIES">Accessories</option>
                <option value="SERVICE">Jasa</option>
              </select>
            </div>

            <!-- Is Service -->
            <div class="flex items-center gap-3 pt-6">
              <input
                v-model="form.isService"
                type="checkbox"
                class="checkbox checkbox-primary"
                id="isService"
              />
              <label for="isService" class="cursor-pointer">
                <span class="font-medium">Ini adalah Jasa</span>
                <span class="block text-xs text-base-content/60">Jasa tidak menghitung stok</span>
              </label>
            </div>

            <!-- Selling Unit -->
            <div>
              <label class="block text-sm font-medium mb-2">Unit Jual *</label>
              <input
                v-model="form.unit"
                type="text"
                class="input input-bordered w-full"
                placeholder="pcs, meter, set"
                required
              />
            </div>

            <!-- Purchase Unit -->
            <div>
              <label class="block text-sm font-medium mb-2">Unit Beli (opsional)</label>
              <input
                v-model="form.purchaseUnit"
                type="text"
                class="input input-bordered w-full"
                placeholder="roll, box, karton"
              />
              <span class="text-xs text-base-content/60">Kosongkan jika sama dengan unit jual</span>
            </div>

            <!-- Conversion Factor -->
            <div>
              <label class="block text-sm font-medium mb-2">Faktor Konversi</label>
              <input
                v-model.number="form.conversionFactor"
                type="number"
                step="0.0001"
                min="1"
                class="input input-bordered w-full"
              />
              <span class="text-xs text-base-content/60">
                1 unit beli = berapa unit jual? (misal: 1 roll = 305 meter)
              </span>
            </div>

            <!-- Purchase Price -->
            <div>
              <label class="block text-sm font-medium mb-2">Harga Beli (HPP)</label>
              <input
                v-model.number="form.purchasePrice"
                type="number"
                min="0"
                class="input input-bordered w-full"
              />
            </div>

            <!-- Selling Price -->
            <div>
              <label class="block text-sm font-medium mb-2">Harga Jual *</label>
              <input
                v-model.number="form.sellingPrice"
                type="number"
                min="0"
                class="input input-bordered w-full"
                required
              />
            </div>

            <!-- Min Stock -->
            <div>
              <label class="block text-sm font-medium mb-2">Stok Minimum</label>
              <input
                v-model.number="form.minStock"
                type="number"
                min="0"
                class="input input-bordered w-full"
              />
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-8 flex justify-end gap-4">
            <button
              type="button"
              @click="navigateTo('/inventory/products')"
              class="btn"
              :disabled="saving"
            >
              Batal
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner"></span>
              Update
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { showAlert } = useAlert()

const saving = ref(false)

const form = reactive({
  sku: '',
  name: '',
  category: '',
  unit: '',
  purchaseUnit: '',
  conversionFactor: 1,
  purchasePrice: 0,
  sellingPrice: 0,
  minStock: 0,
  isService: false,
})

// Load product
const { data } = await useFetch(`/api/products/${route.params.id}`)
if (data.value) {
  const p = data.value as any
  form.sku = p.sku
  form.name = p.name
  form.category = p.category
  form.unit = p.unit
  form.purchaseUnit = p.purchaseUnit || ''
  form.conversionFactor = parseFloat(p.conversionFactor) || 1
  form.purchasePrice = parseFloat(p.purchasePrice) || 0
  form.sellingPrice = parseFloat(p.sellingPrice) || 0
  form.minStock = p.minStock || 0
  form.isService = p.isService || false
}

const saveProduct = async () => {
  saving.value = true
  try {
    await $fetch(`/api/products/${route.params.id}`, {
      method: 'PUT',
      body: form,
    })
    showAlert('Produk berhasil diupdate!', 'success')
    navigateTo('/inventory/products')
  } catch (err: any) {
    showAlert(err.data?.message || 'Gagal menyimpan produk', 'error')
  } finally {
    saving.value = false
  }
}
</script>
