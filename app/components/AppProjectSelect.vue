<template>
  <div class="dropdown w-full" :class="{ 'dropdown-open': isOpen }">
    <div class="form-control">
      <div class="relative">
        <input
          ref="inputRef"
          type="text"
          v-model="searchQuery"
          class="input input-bordered w-full pr-10"
          :placeholder="placeholder"
          @focus="onFocus"
          @input="onInput"
          @blur="onBlur"
        />
        <div v-if="loading" class="absolute right-3 top-3">
          <span class="loading loading-spinner loading-xs text-base-content/50"></span>
        </div>
        <div
          v-else-if="selectedProject"
          class="absolute right-3 top-3 cursor-pointer"
          @click="clearSelection"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-base-content/50 hover:text-error"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
    <ul
      v-if="isOpen && (results.length > 0 || loading)"
      class="absolute z-50 menu p-2 shadow bg-base-100 rounded-box w-full max-h-60 overflow-y-auto flex-nowrap mt-1 border border-base-200"
      @mousedown.prevent
    >
      <li v-for="project in results" :key="project.id">
        <a @click="selectProject(project)" class="flex flex-col items-start gap-0 py-2">
          <div class="flex justify-between w-full font-semibold">
            <span class="font-mono text-primary">{{ project.projectNumber }}</span>
            <span
              class="badge badge-xs"
              :class="{
                'badge-warning': project.status === 'ONGOING',
                'badge-success': project.status === 'COMPLETED',
                'badge-info': project.status === 'APPROVED',
                'badge-ghost': project.status === 'DRAFT',
              }"
            >
              {{ project.status }}
            </span>
          </div>
          <div class="text-sm truncate w-full">{{ project.title }}</div>
          <div class="flex justify-between w-full text-xs text-base-content/60">
            <span>{{ project.customer?.name || '-' }}</span>
            <div class="text-right">
              <span class="font-mono">{{ formatCurrency(getProjectTotal(project)) }}</span>
              <span v-if="project.paidAmount > 0" class="text-success ml-1">
                (Dibayar: {{ formatCurrency(project.paidAmount) }})
              </span>
            </div>
          </div>
          <div
            v-if="
              project.remainingAmount !== undefined &&
              project.remainingAmount < getProjectTotal(project)
            "
            class="w-full text-xs mt-1"
          >
            <span class="text-warning font-semibold">
              Sisa: {{ formatCurrency(project.remainingAmount) }}
            </span>
          </div>
        </a>
      </li>
      <li
        v-if="results.length === 0 && !loading && searchQuery"
        class="px-4 py-2 text-sm text-base-content/60 text-center"
      >
        Proyek tidak ditemukan
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const props = defineProps<{
  modelValue?: string
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', project: any): void
  (e: 'clear'): void
}>()

const { formatCurrency } = useFormatter()

const searchQuery = ref(props.modelValue || '')
const isOpen = ref(false)
const loading = ref(false)
const results = ref<any[]>([])
const selectedProject = ref<any>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// Watch props to update internal state if changed externally
// Only update if the value is DIFFERENT from any selected project ID
// This prevents the bug where project ID shows instead of project name
watch(
  () => props.modelValue,
  async val => {
    // If val is being set externally (like initial load) and matches selected project ID, ignore
    if (selectedProject.value && selectedProject.value.id === val) {
      return
    }

    // If val is cleared
    if (!val) {
      searchQuery.value = ''
      selectedProject.value = null
      return
    }

    // If it looks like a project ID (long string), try to fetch the project
    if (val && val.length > 10 && !searchQuery.value.includes('-')) {
      try {
        const response = await $fetch<{ data: any[] }>('/api/projects', {
          params: { limit: 1, search: val },
        })
        const project = response?.data?.find(p => p.id === val)
        if (project) {
          selectedProject.value = project
          searchQuery.value = `${project.projectNumber} - ${project.title}`
        }
      } catch (e) {
        // Ignore errors
      }
    }
  },
  { immediate: true }
)

// Calculate project total from items (selling price)
const getProjectTotal = (project: any): number => {
  if (!project?.items?.length) {
    // Fallback to totalAmount if items not loaded
    return parseFloat(project?.totalAmount || project?.budget || 0)
  }
  return project.items.reduce((sum: number, item: any) => sum + parseFloat(item.totalPrice || 0), 0)
}

const searchProjects = async (query: string) => {
  loading.value = true
  try {
    const response = await $fetch<{ data: any[]; meta: any }>('/api/projects', {
      params: { search: query, limit: 20 },
    })
    results.value = response?.data || []
  } catch (err) {
    console.error('Search error:', err)
    results.value = []
  } finally {
    loading.value = false
  }
}

const loadAllProjects = async () => {
  loading.value = true
  try {
    const response = await $fetch<{ data: any[]; meta: any }>('/api/projects', {
      params: { limit: 50 },
    })
    results.value = response?.data || []
  } catch (err) {
    console.error('Load error:', err)
    results.value = []
  } finally {
    loading.value = false
  }
}

const debouncedSearch = useDebounceFn((query: string) => {
  if (query && query.length >= 2) {
    searchProjects(query)
  } else if (!query) {
    loadAllProjects()
  }
}, 300)

const onInput = () => {
  isOpen.value = true
  selectedProject.value = null
  emit('update:modelValue', searchQuery.value)
  debouncedSearch(searchQuery.value)
}

const onFocus = () => {
  isOpen.value = true
  loadAllProjects()
}

const onBlur = () => {
  // Delay closing to allow click event on dropdown item to fire
  setTimeout(() => {
    isOpen.value = false
  }, 200)
}

const selectProject = (project: any) => {
  selectedProject.value = project
  searchQuery.value = `${project.projectNumber} - ${project.title}`
  isOpen.value = false
  emit('update:modelValue', project.id)
  emit('select', project)
}

const clearSelection = () => {
  searchQuery.value = ''
  selectedProject.value = null
  results.value = []
  emit('update:modelValue', '')
  emit('clear')
  if (inputRef.value) inputRef.value.focus()
}
</script>
