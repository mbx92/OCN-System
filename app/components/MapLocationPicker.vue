<template>
  <div class="space-y-3">
    <!-- Search Input -->
    <div class="form-control">
      <div class="input-group input-group-sm">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari lokasi..."
          class="input input-bordered input-sm w-full"
          @keyup.enter="searchLocation"
        />
        <button
          type="button"
          @click="searchLocation"
          class="btn btn-sm btn-square"
          :disabled="searching"
        >
          <span v-if="searching" class="loading loading-spinner loading-xs"></span>
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Search Results -->
    <div v-if="searchResults.length" class="bg-base-200 rounded-lg p-2 max-h-32 overflow-y-auto">
      <div
        v-for="result in searchResults"
        :key="result.place_id"
        class="p-2 hover:bg-base-300 rounded cursor-pointer text-sm"
        @click="selectSearchResult(result)"
      >
        {{ result.display_name }}
      </div>
    </div>

    <!-- Map Container -->
    <div ref="mapContainer" class="w-full h-64 rounded-lg border border-base-300 bg-base-200"></div>

    <!-- Actions -->
    <div class="flex gap-2">
      <button
        type="button"
        @click="getMyLocation"
        class="btn btn-sm btn-outline gap-1"
        :disabled="gettingLocation"
      >
        <span v-if="gettingLocation" class="loading loading-spinner loading-xs"></span>
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
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Lokasi Saya
      </button>
      <button
        v-if="hasLocation"
        type="button"
        @click="clearLocation"
        class="btn btn-sm btn-ghost text-error gap-1"
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
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
        Hapus
      </button>
    </div>

    <!-- Coordinates Display -->
    <div v-if="hasLocation" class="text-xs text-base-content/60 font-mono">
      {{ latitude?.toFixed(6) }}, {{ longitude?.toFixed(6) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Map, Marker } from 'leaflet'

const props = defineProps<{
  modelValue?: { latitude: number | null; longitude: number | null }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { latitude: number | null; longitude: number | null }]
}>()

const mapContainer = ref<HTMLElement | null>(null)
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const searching = ref(false)
const gettingLocation = ref(false)

let map: Map | null = null
let marker: Marker | null = null
let L: any = null

const latitude = computed({
  get: () => props.modelValue?.latitude ?? null,
  set: val => emit('update:modelValue', { latitude: val, longitude: longitude.value }),
})

const longitude = computed({
  get: () => props.modelValue?.longitude ?? null,
  set: val => emit('update:modelValue', { latitude: latitude.value, longitude: val }),
})

const hasLocation = computed(() => latitude.value !== null && longitude.value !== null)

const initMap = async () => {
  if (!mapContainer.value || map) return

  // Dynamic import Leaflet
  L = await import('leaflet')
  await import('leaflet/dist/leaflet.css')

  // Fix default icon paths
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })

  // Default center (Indonesia)
  const defaultLat = latitude.value ?? -6.2
  const defaultLng = longitude.value ?? 106.8
  const defaultZoom = hasLocation.value ? 15 : 5

  map = L.map(mapContainer.value).setView([defaultLat, defaultLng], defaultZoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map)

  // Add marker if has location
  if (hasLocation.value) {
    marker = L.marker([latitude.value!, longitude.value!]).addTo(map)
  }

  // Click handler
  map.on('click', (e: any) => {
    setMarker(e.latlng.lat, e.latlng.lng)
  })
}

const setMarker = (lat: number, lng: number) => {
  if (!map || !L) return

  if (marker) {
    marker.setLatLng([lat, lng])
  } else {
    marker = L.marker([lat, lng]).addTo(map)
  }

  map.setView([lat, lng], 15)
  emit('update:modelValue', { latitude: lat, longitude: lng })
}

const getMyLocation = () => {
  if (!navigator.geolocation) {
    alert('Geolocation tidak didukung browser ini')
    return
  }

  gettingLocation.value = true
  navigator.geolocation.getCurrentPosition(
    position => {
      setMarker(position.coords.latitude, position.coords.longitude)
      gettingLocation.value = false
    },
    error => {
      alert('Gagal mendapatkan lokasi: ' + error.message)
      gettingLocation.value = false
    },
    { enableHighAccuracy: true }
  )
}

const searchLocation = async () => {
  if (!searchQuery.value.trim()) return

  searching.value = true
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}&limit=5`
    )
    searchResults.value = await response.json()
  } catch (error) {
    console.error('Search error:', error)
  } finally {
    searching.value = false
  }
}

const selectSearchResult = (result: any) => {
  setMarker(parseFloat(result.lat), parseFloat(result.lon))
  searchResults.value = []
  searchQuery.value = result.display_name
}

const clearLocation = () => {
  if (marker && map) {
    map.removeLayer(marker)
    marker = null
  }
  emit('update:modelValue', { latitude: null, longitude: null })
}

onMounted(() => {
  initMap()
})

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>
