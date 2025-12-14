<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center gap-4">
      <NuxtLink to="/quotations" class="btn btn-ghost btn-sm btn-circle">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <div>
        <h1 class="text-2xl font-bold">Buat Penawaran</h1>
        <p class="text-base-content/60">Buat penawaran harga baru</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Form -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Customer Selection -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Pelanggan</h2>
            <div class="form-control">
              <select v-model="form.customerId" class="select select-bordered" required>
                <option value="">Pilih pelanggan</option>
                <option v-for="customer in customers" :key="customer.id" :value="customer.id">
                  {{ customer.name }} {{ customer.companyName ? `(${customer.companyName})` : '' }}
                </option>
              </select>
            </div>
            <div class="form-control mt-2">
              <input
                v-model="form.title"
                type="text"
                placeholder="Judul penawaran (opsional)"
                class="input input-bordered"
              />
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h2 class="card-title">Item Penawaran</h2>
              <button @click="addItem" class="btn btn-primary btn-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Tambah Item
              </button>
            </div>

            <div v-if="form.items.length === 0" class="text-center py-8 text-base-content/60">
              <p>Belum ada item</p>
              <button @click="addItem" class="btn btn-outline btn-sm mt-2">Tambah Item Pertama</button>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="(item, index) in form.items"
                :key="index"
                class="p-4 bg-base-200 rounded-lg"
              >
                <div class="flex justify-between items-start mb-3">
                  <span class="badge badge-ghost">Item {{ index + 1 }}</span>
                  <button @click="removeItem(index)" class="btn btn-ghost btn-xs btn-circle text-error">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <!-- Product Select or Custom -->
                  <div class="form-control sm:col-span-2">
                    <select v-model="item.productId" class="select select-bordered select-sm" @change="onProductSelect(index)">
                      <option value="">Item Custom</option>
                      <optgroup v-for="cat in categories" :key="cat" :label="cat">
                        <option v-for="product in productsByCategory[cat]" :key="product.id" :value="product.id">
                          {{ product.name }} - {{ formatCurrency(product.sellingPrice) }}
                        </option>
                      </optgroup>
                    </select>
                  </div>

                  <!-- Name -->
                  <div class="form-control sm:col-span-2">
                    <input
                      v-model="item.name"
                      type="text"
                      placeholder="Nama item"
                      class="input input-bordered input-sm"
                      required
                    />
                  </div>

                  <!-- Quantity -->
                  <div class="form-control">
                    <div class="join">
                      <input
                        v-model.number="item.quantity"
                        type="number"
                        min="1"
                        class="input input-bordered input-sm join-item w-20"
                        required
                      />
                      <input
                        v-model="item.unit"
                        type="text"
                        placeholder="unit"
                        class="input input-bordered input-sm join-item w-20"
                        required
                      />
                    </div>
                  </div>

                  <!-- Price -->
                  <div class="form-control">
                    <input
                      v-model.number="item.price"
                      type="number"
                      min="0"
                      placeholder="Harga"
                      class="input input-bordered input-sm"
                      required
                    />
                  </div>
                </div>

                <div class="text-right mt-2">
                  <span class="text-sm text-base-content/60">Subtotal:</span>
                  <span class="font-semibold ml-2">{{ formatCurrency(item.quantity * item.price) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Catatan</h2>
            <textarea
              v-model="form.notes"
              placeholder="Catatan untuk pelanggan (opsional)"
              class="textarea textarea-bordered"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div class="lg:col-span-1">
        <div class="card bg-base-100 shadow sticky top-20">
          <div class="card-body">
            <h2 class="card-title">Ringkasan</h2>

            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-base-content/60">Jumlah Item</span>
                <span>{{ form.items.length }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/60">Berlaku</span>
                <span>{{ form.validDays }} hari</span>
              </div>
              <div class="divider my-2"></div>
              <div class="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span class="text-primary">{{ formatCurrency(totalAmount) }}</span>
              </div>
            </div>

            <div class="form-control mt-4">
              <label class="label">
                <span class="label-text">Masa Berlaku</span>
              </label>
              <select v-model.number="form.validDays" class="select select-bordered select-sm">
                <option :value="7">7 hari</option>
                <option :value="14">14 hari</option>
                <option :value="30">30 hari</option>
              </select>
            </div>

            <div class="card-actions mt-4">
              <button
                @click="handleSubmit"
                class="btn btn-primary w-full"
                :disabled="!canSubmit || loading"
              >
                <span v-if="loading" class="loading loading-spinner loading-sm"></span>
                Simpan Penawaran
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { formatCurrency } = useFormatter()
const { success, error: showError } = useAlert()

interface QuotationItem {
  productId: string | null
  name: string
  quantity: number
  unit: string
  price: number
}

const form = reactive({
  customerId: (route.query.customerId as string) || '',
  title: '',
  items: [] as QuotationItem[],
  validDays: 14,
  notes: '',
})

const loading = ref(false)

// Fetch data
const { data: customers } = await useFetch('/api/customers', { query: { limit: 100 } })
const { data: products } = await useFetch('/api/products')

const categories = computed(() => {
  if (!products.value) return []
  return [...new Set(products.value.map((p: any) => p.category))]
})

const productsByCategory = computed(() => {
  if (!products.value) return {}
  return products.value.reduce((acc: any, p: any) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})
})

const totalAmount = computed(() => {
  return form.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
})

const canSubmit = computed(() => {
  return form.customerId && form.items.length > 0 && form.items.every(i => i.name && i.quantity > 0 && i.price >= 0)
})

const addItem = () => {
  form.items.push({
    productId: null,
    name: '',
    quantity: 1,
    unit: 'pcs',
    price: 0,
  })
}

const removeItem = (index: number) => {
  form.items.splice(index, 1)
}

const onProductSelect = (index: number) => {
  const item = form.items[index]
  if (item.productId) {
    const product = products.value?.find((p: any) => p.id === item.productId)
    if (product) {
      item.name = product.name
      item.unit = product.unit
      item.price = parseFloat(product.sellingPrice)
    }
  }
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  loading.value = true
  try {
    const quotation = await $fetch('/api/quotations', {
      method: 'POST',
      body: form,
    })
    success('Penawaran berhasil dibuat')
    await navigateTo(`/quotations/${(quotation as any).id}`)
  } catch (err: any) {
    showError(err.data?.message || 'Gagal membuat penawaran')
  } finally {
    loading.value = false
  }
}
</script>
