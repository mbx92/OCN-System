<template>
  <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
    <div class="text-sm text-base-content/60">
      Menampilkan {{ startItem }}-{{ endItem }} dari {{ total }} data
    </div>
    <div class="join">
      <button class="join-item btn btn-sm" :disabled="currentPage <= 1" @click="goToPage(1)">
        «
      </button>
      <button
        class="join-item btn btn-sm"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
      >
        ‹
      </button>

      <template v-for="pageNum in visiblePages" :key="pageNum">
        <button v-if="pageNum === '...'" class="join-item btn btn-sm btn-disabled">...</button>
        <button
          v-else
          class="join-item btn btn-sm"
          :class="{ 'btn-active': pageNum === currentPage }"
          @click="goToPage(pageNum as number)"
        >
          {{ pageNum }}
        </button>
      </template>

      <button
        class="join-item btn btn-sm"
        :disabled="currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
      >
        ›
      </button>
      <button
        class="join-item btn btn-sm"
        :disabled="currentPage >= totalPages"
        @click="goToPage(totalPages)"
      >
        »
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  total: number
  perPage: number
  currentPage: number
}>()

const emit = defineEmits<{
  (e: 'update:currentPage', page: number): void
}>()

const totalPages = computed(() => Math.ceil(props.total / props.perPage) || 1)

const startItem = computed(() => {
  if (props.total === 0) return 0
  return (props.currentPage - 1) * props.perPage + 1
})

const endItem = computed(() => {
  return Math.min(props.currentPage * props.perPage, props.total)
})

const visiblePages = computed(() => {
  const pages: (number | string)[] = []
  const total = totalPages.value
  const current = props.currentPage

  if (total <= 7) {
    // Show all pages
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)

    if (current > 3) {
      pages.push('...')
    }

    // Show pages around current
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (current < total - 2) {
      pages.push('...')
    }

    // Always show last page
    pages.push(total)
  }

  return pages
})

const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    emit('update:currentPage', page)
  }
}
</script>
