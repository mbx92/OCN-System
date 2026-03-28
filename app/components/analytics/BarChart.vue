<template>
  <Bar :data="computedData" :options="chartOptions" />
</template>

<script setup>
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  chartData: {
    type: Object,
    required: true
  }
})

// Attach each dataset to its own Y axis
const computedData = computed(() => {
  if (!props.chartData?.datasets) return props.chartData
  return {
    ...props.chartData,
    datasets: props.chartData.datasets.map((ds, i) => ({
      ...ds,
      yAxisID: i === 0 ? 'yIncome' : 'yExpense',
      minBarLength: 4,
      borderRadius: 4,
    }))
  }
})

const fmt = (value) => {
  if (value >= 1_000_000) return 'Rp ' + (value / 1_000_000).toFixed(1) + ' M'
  if (value >= 1_000) return 'Rp ' + (value / 1_000).toFixed(0) + ' K'
  return 'Rp ' + value
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.dataset.label || ''
          return `${label}: Rp ${new Intl.NumberFormat('id-ID').format(context.parsed.y)}`
        }
      }
    }
  },
  scales: {
    yIncome: {
      type: 'linear',
      position: 'left',
      beginAtZero: true,
      title: { display: true, text: 'Pemasukan' },
      ticks: { callback: fmt },
      grid: { color: 'rgba(0,0,0,0.06)' },
    },
    yExpense: {
      type: 'linear',
      position: 'right',
      beginAtZero: true,
      title: { display: true, text: 'Pengeluaran' },
      ticks: { callback: fmt },
      grid: { drawOnChartArea: false },
    },
  }
}
</script>