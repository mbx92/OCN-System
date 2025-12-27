<template>
  <div class="font-sans text-sm" style="min-width: 700px">
    <!-- Header -->
    <div class="flex justify-between border-b-2 border-gray-800 pb-4 mb-4">
      <div class="flex items-start gap-4">
        <div
          class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl"
        >
          OC
        </div>
        <div>
          <h1 class="text-2xl font-bold">INVOICE</h1>
          <p class="font-bold">OC Networks</p>
          <p class="text-xs">CV. Kanya Tama Teknologi</p>
          <p class="text-xs">Jalan Mertasari No. 20 Kerobokan Kelod</p>
          <p class="text-xs">082146586160</p>
        </div>
      </div>
      <div class="text-right text-xs">
        <table class="ml-auto">
          <tr>
            <td class="pr-2">No Transaksi</td>
            <td>:</td>
            <td class="pl-2 font-mono">{{ payment.paymentNumber }}</td>
          </tr>
          <tr>
            <td class="pr-2">Tanggal</td>
            <td>:</td>
            <td class="pl-2">{{ formatDateTime(payment.paymentDate) }}</td>
          </tr>
          <tr>
            <td class="pr-2">Pelanggan</td>
            <td>:</td>
            <td class="pl-2">{{ payment.project?.customer?.name || '-' }}</td>
          </tr>
          <tr>
            <td class="pr-2">Alamat</td>
            <td>:</td>
            <td class="pl-2">{{ payment.project?.customer?.address || '-' }}</td>
          </tr>
        </table>
      </div>
      <div class="text-right text-xs">
        <table class="ml-auto">
          <tr>
            <td class="pr-2">Dept.</td>
            <td>:</td>
            <td class="pl-2">OCN</td>
          </tr>
          <tr>
            <td class="pr-2">User</td>
            <td>:</td>
            <td class="pl-2">{{ payment.receivedBy || 'ADMIN' }}</td>
          </tr>
          <tr>
            <td class="pr-2">PPN</td>
            <td>:</td>
            <td class="pl-2">Non</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Items Table -->
    <table class="w-full mb-4 text-xs">
      <thead>
        <tr class="bg-gray-100 border-y border-gray-400">
          <th class="py-2 px-1 text-left w-8">No.</th>
          <th class="py-2 px-1 text-left" style="min-width: 80px; max-width: 100px">Kode Item</th>
          <th class="py-2 px-1 text-left">Nama Item</th>
          <th class="py-2 px-1 text-center w-20">Jml</th>
          <th class="py-2 px-1 text-left w-16">Satuan</th>
          <th class="py-2 px-1 text-right w-24">Harga</th>
          <th class="py-2 px-1 text-center w-12">Pot</th>
          <th class="py-2 px-1 text-right w-28">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, idx) in items" :key="item.id" class="border-b border-gray-200">
          <td class="py-1 px-1">{{ idx + 1 }}</td>
          <td class="py-1 px-1 font-mono text-[10px] break-all">{{ item.product?.sku || '-' }}</td>
          <td class="py-1 px-1">{{ item.name }}</td>
          <td class="py-1 px-1 text-center">{{ item.quantity }}</td>
          <td class="py-1 px-1">{{ item.unit }}</td>
          <td class="py-1 px-1 text-right font-mono">{{ formatNumber(item.price) }}</td>
          <td class="py-1 px-1 text-center">0</td>
          <td class="py-1 px-1 text-right font-mono">{{ formatNumber(item.totalPrice) }}</td>
        </tr>
        <!-- Empty rows to fill space -->
        <tr v-for="i in emptyRows" :key="'empty-' + i" class="border-b border-gray-200">
          <td class="py-1 px-1">&nbsp;</td>
          <td class="py-1 px-1"></td>
          <td class="py-1 px-1"></td>
          <td class="py-1 px-1"></td>
          <td class="py-1 px-1"></td>
          <td class="py-1 px-1"></td>
          <td class="py-1 px-1"></td>
          <td class="py-1 px-1"></td>
        </tr>
      </tbody>
    </table>

    <!-- Footer Section -->
    <div class="flex justify-between border-t-2 border-gray-800 pt-4">
      <!-- Left: Keterangan -->
      <div class="text-xs w-1/3">
        <p class="font-bold mb-2">Keterangan :</p>
        <div class="flex gap-8 mb-4">
          <div>
            <p>Hormat Kami</p>
            <p class="mt-8">(....................)</p>
          </div>
          <div>
            <p>Penerima</p>
            <p class="mt-8">(....................)</p>
          </div>
        </div>
        <p class="mt-4">
          <strong>Terbilang</strong>
          : {{ terbilang(subTotal) }}
        </p>
        <p class="text-xs text-gray-500 mt-2">{{ formatDateTime(new Date().toISOString()) }}</p>
      </div>

      <!-- Middle: Summary Left -->
      <div class="text-xs w-1/4">
        <table>
          <tr>
            <td class="pr-2">Jml Item</td>
            <td>:</td>
            <td class="pl-2 text-right">{{ items.length }}</td>
          </tr>
          <tr>
            <td class="pr-2">Potongan</td>
            <td>:</td>
            <td class="pl-2 text-right">0 %</td>
          </tr>
          <tr>
            <td class="pr-2">Pajak</td>
            <td>:</td>
            <td class="pl-2 text-right">0 %</td>
          </tr>
          <tr>
            <td class="pr-2">Biaya Lain</td>
            <td>:</td>
            <td class="pl-2 text-right">0</td>
          </tr>
          <tr>
            <td class="pr-2">Tanggal Jt</td>
            <td>:</td>
            <td class="pl-2 text-right">{{ formatDate(payment.paymentDate) }}</td>
          </tr>
        </table>
      </div>

      <!-- Right: Summary Right -->
      <div class="text-xs w-1/3">
        <table class="w-full">
          <tr>
            <td class="pr-2">Sub Total</td>
            <td>:</td>
            <td class="pl-2 text-right font-mono">{{ formatNumber(subTotal) }}</td>
          </tr>
          <tr>
            <td class="pr-2">Total Akhir</td>
            <td>:</td>
            <td class="pl-2 text-right font-mono font-bold">{{ formatNumber(subTotal) }}</td>
          </tr>
          <tr>
            <td class="pr-2">DP PO</td>
            <td>:</td>
            <td class="pl-2 text-right font-mono">0</td>
          </tr>
          <tr class="bg-green-100">
            <td class="pr-2 font-bold">{{ payment.method }}</td>
            <td>:</td>
            <td class="pl-2 text-right font-mono font-bold">{{ formatNumber(payment.amount) }}</td>
          </tr>
          <tr>
            <td class="pr-2">Kredit</td>
            <td>:</td>
            <td class="pl-2 text-right font-mono">{{ formatNumber(kredit) }}</td>
          </tr>
          <tr>
            <td class="pr-2">Kembali</td>
            <td>:</td>
            <td class="pl-2 text-right font-mono">0</td>
          </tr>
        </table>
        <p class="text-right text-xs mt-4">{{ payment.receivedBy || 'ADMIN' }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  payment: any
}>()

const { formatDate } = useFormatter()

const items = computed(() => props.payment?.project?.items || [])
const emptyRows = computed(() => Math.max(0, 7 - items.value.length))

const subTotal = computed(() => {
  return items.value.reduce((sum: number, item: any) => sum + parseFloat(item.totalPrice || 0), 0)
})

const kredit = computed(() => {
  return Math.max(0, subTotal.value - parseFloat(props.payment?.amount || 0))
})

const formatNumber = (num: any) => {
  return new Intl.NumberFormat('id-ID').format(parseFloat(num || 0))
}

const formatDateTime = (date: string) => {
  if (!date) return '-'
  const d = new Date(date)
  return (
    d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  )
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
  if (angka < 1000000000000)
    return terbilang(Math.floor(angka / 1000000000)) + ' milyar ' + terbilang(angka % 1000000000)

  return (
    terbilang(Math.floor(angka / 1000000000000)) + ' triliun ' + terbilang(angka % 1000000000000)
  )
}
</script>
