<template>
  <div class="font-sans text-sm bg-white p-8" style="width: 800px">
    <!-- Header -->
    <div class="flex justify-between items-start mb-6">
      <!-- Left: Logo & Company Info -->
      <div class="flex items-start gap-4">
        <img
          :src="company?.settings?.logo || '/logo.png'"
          alt="Logo"
          class="w-16 h-16 object-contain"
        />
        <div class="text-xs">
          <p class="font-bold text-base">{{ company?.name || 'OCN CCTV & Networking' }}</p>
          <p>Tel: {{ company?.settings?.phone || '-' }}</p>
          <p>{{ company?.settings?.address || '-' }}</p>
          <p>{{ company?.settings?.email || '-' }}</p>
        </div>
      </div>
      <!-- Right: Receipt Number -->
      <div class="text-right">
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold">Kwitansi No :</span>
          <span class="text-2xl font-mono font-bold border-2 border-gray-800 px-4 py-1 rounded">
            {{ payment.paymentNumber }}
          </span>
        </div>
        <div class="mt-2">
          <span
            class="px-3 py-1 text-sm font-bold rounded"
            :class="{
              'bg-blue-100 text-blue-800': payment.type === 'DP',
              'bg-green-100 text-green-800': payment.type === 'FULL',
              'bg-yellow-100 text-yellow-800': payment.type === 'INSTALLMENT',
              'bg-purple-100 text-purple-800': payment.type === 'SETTLEMENT',
            }"
          >
            {{ getPaymentTypeLabel(payment.type) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Received From & Date Row -->
    <div class="flex justify-between mb-4 border-b border-dotted border-gray-400 pb-2">
      <div class="flex items-center gap-2">
        <span class="font-semibold w-32">Diterima dari</span>
        <span>:</span>
        <span class="font-bold">{{ payment.project?.customer?.name || '-' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="font-semibold">Tanggal</span>
        <span>:</span>
        <span>{{ formatDate(payment.paymentDate) }}</span>
      </div>
    </div>

    <!-- Amount in Big Box -->
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-2">
        <span class="font-semibold w-32">Jumlah Uang</span>
        <span>:</span>
      </div>
      <div class="border-2 border-gray-800 rounded px-6 py-6 text-center">
        <span class="text-3xl font-bold font-mono">Rp {{ formatNumber(payment.amount) }}</span>
      </div>
    </div>

    <!-- Terbilang -->
    <div class="mb-4 border-b border-dotted border-gray-400 pb-2">
      <div class="flex gap-2">
        <span class="font-semibold w-32">Terbilang</span>
        <span>:</span>
        <span class="italic">{{ terbilang(parseFloat(payment.amount || 0)) }} rupiah</span>
      </div>
    </div>

    <!-- Payment For -->
    <div class="mb-6 border-b border-dotted border-gray-400 pb-2">
      <div class="flex gap-2">
        <span class="font-semibold w-32">Untuk Pembayaran</span>
        <span>:</span>
        <span>
          {{ getPaymentTypeLabel(payment.type) }} - Project
          {{ payment.project?.projectNumber || '-' }}
          <span v-if="payment.project?.title">({{ payment.project.title }})</span>
        </span>
      </div>
    </div>

    <!-- Amount Details & Payment Method -->
    <div class="flex justify-between mb-6">
      <!-- Left: Amount Details -->
      <div class="space-y-3">
        <div class="flex items-center gap-3">
          <span class="w-40">Total Project</span>
          <span>: Rp</span>
          <span class="font-mono w-32 text-right">{{ formatNumber(subTotal) }}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-40">Jumlah Dibayar</span>
          <span>: Rp</span>
          <span class="font-mono w-32 text-right font-bold">
            {{ formatNumber(payment.amount) }}
          </span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-40">Sisa Pembayaran</span>
          <span>: Rp</span>
          <span class="font-mono w-32 text-right">
            {{ formatNumber(kredit) }}
          </span>
        </div>

        <!-- Bank Info -->
        <div
          v-if="company?.settings?.bankName || company?.settings?.bankAccount"
          class="mt-3 pt-2 border-t border-gray-300"
        >
          <p class="font-semibold text-xs mb-1">Transfer ke:</p>
          <p v-if="company?.settings?.bankName" class="text-xs">{{ company.settings.bankName }}</p>
          <p v-if="company?.settings?.bankAccount" class="text-xs font-mono">
            {{ company.settings.bankAccount }}
          </p>
          <p v-if="company?.settings?.bankAccountName" class="text-xs">
            a.n. {{ company.settings.bankAccountName }}
          </p>
        </div>
      </div>

      <!-- Right: Payment Method -->
      <div class="space-y-2 text-sm">
        <div class="flex items-center gap-3">
          <span
            class="w-4 h-4 border-2 rounded-full flex items-center justify-center"
            :class="payment.method === 'CASH' ? 'border-gray-800' : 'border-gray-400'"
          >
            <span v-if="payment.method === 'CASH'" class="text-xs">●</span>
          </span>
          <span>Cash</span>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="w-4 h-4 border-2 rounded-full flex items-center justify-center"
            :class="payment.method === 'TRANSFER' ? 'border-gray-800' : 'border-gray-400'"
          >
            <span v-if="payment.method === 'TRANSFER'" class="text-xs">●</span>
          </span>
          <span>Transfer</span>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="w-4 h-4 border-2 rounded-full flex items-center justify-center"
            :class="payment.method === 'QRIS' ? 'border-gray-800' : 'border-gray-400'"
          >
            <span v-if="payment.method === 'QRIS'" class="text-xs">●</span>
          </span>
          <span>QRIS</span>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="w-4 h-4 border-2 rounded-full flex items-center justify-center"
            :class="payment.method === 'CARD' ? 'border-gray-800' : 'border-gray-400'"
          >
            <span v-if="payment.method === 'CARD'" class="text-xs">●</span>
          </span>
          <span>Kartu Debit/Kredit</span>
        </div>
      </div>

      <!-- Signature Area -->
      <div class="text-center">
        <p class="text-xs text-gray-500 mb-2">Kerobokan, {{ formatDate(payment.paymentDate) }}</p>
        <div class="h-16 flex items-center justify-center">
          <img
            v-if="company?.settings?.signature"
            :src="company.settings.signature"
            alt="Signature"
            class="max-h-14 object-contain"
          />
        </div>
        <div class="border-t border-gray-400 pt-1 px-4">
          <p class="font-semibold">Authorized Signature</p>
        </div>
      </div>
    </div>

    <!-- Notes if any -->
    <div v-if="payment.notes" class="text-xs text-gray-600 border-t pt-2">
      <span class="font-semibold">Catatan:</span>
      {{ payment.notes }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  payment: any
  company?: any
}>()

const { formatDate } = useFormatter()

const getPaymentTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    DP: 'DOWN PAYMENT',
    FULL: 'LUNAS',
    INSTALLMENT: 'CICILAN',
    SETTLEMENT: 'PELUNASAN',
  }
  return labels[type] || type
}

const items = computed(() => props.payment?.project?.items || [])

const subTotal = computed(() => {
  return items.value.reduce((sum: number, item: any) => sum + parseFloat(item.totalPrice || 0), 0)
})

const kredit = computed(() => {
  return Math.max(0, subTotal.value - parseFloat(props.payment?.amount || 0))
})

const formatNumber = (num: any) => {
  return new Intl.NumberFormat('id-ID').format(parseFloat(num || 0))
}

// Convert number to Indonesian words
const terbilang = (angka: number): string => {
  const huruf = [
    '',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
    'sebelas',
  ]

  if (angka < 12) return huruf[angka]
  if (angka < 20) return huruf[angka - 10] + ' belas'
  if (angka < 100) return huruf[Math.floor(angka / 10)] + ' puluh ' + huruf[angka % 10]
  if (angka < 200) return 'seratus ' + terbilang(angka - 100)
  if (angka < 1000) return huruf[Math.floor(angka / 100)] + ' ratus ' + terbilang(angka % 100)
  if (angka < 2000) return 'seribu ' + terbilang(angka - 1000)
  if (angka < 1000000)
    return terbilang(Math.floor(angka / 1000)) + ' ribu ' + terbilang(angka % 1000)
  if (angka < 1000000000)
    return terbilang(Math.floor(angka / 1000000)) + ' juta ' + terbilang(angka % 1000000)
  return terbilang(Math.floor(angka / 1000000000)) + ' milyar ' + terbilang(angka % 1000000000)
}
</script>
