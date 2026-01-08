<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div class="flex items-center gap-4">
        <NuxtLink to="/customers" class="btn btn-ghost btn-sm btn-circle">
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </NuxtLink>
        <div>
          <h1 class="text-2xl font-bold">{{ customer?.name }}</h1>
          <p v-if="customer?.companyName" class="text-base-content/60">
            {{ customer.companyName }}
          </p>
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="isEditing = true" v-if="!isEditing" class="btn btn-outline btn-sm">
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit
        </button>
        <NuxtLink
          :to="`/quotations/create?customerId=${customer?.id}`"
          class="btn btn-primary btn-sm"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Buat Penawaran
        </NuxtLink>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Customer Info -->
      <div class="lg:col-span-1">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Informasi Pelanggan</h2>

            <!-- View Mode -->
            <div v-if="!isEditing" class="space-y-4">
              <div>
                <p class="text-sm text-base-content/60">Telepon</p>
                <p class="font-mono">{{ customer?.phone }}</p>
              </div>
              <div v-if="customer?.email">
                <p class="text-sm text-base-content/60">Email</p>
                <p>{{ customer.email }}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Alamat</p>
                <p>{{ customer?.address }}</p>
              </div>
              <div v-if="customer?.latitude && customer?.longitude">
                <p class="text-sm text-base-content/60">Lokasi</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="font-mono text-xs">
                    {{ customer.latitude.toFixed(6) }}, {{ customer.longitude.toFixed(6) }}
                  </span>
                  <a
                    :href="`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`"
                    target="_blank"
                    class="btn btn-primary btn-xs"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3"
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
                    Buka Maps
                  </a>
                </div>
                <!-- Map Preview -->
                <div class="mt-3 rounded-lg overflow-hidden border border-base-300">
                  <iframe
                    :src="`https://www.openstreetmap.org/export/embed.html?bbox=${customer.longitude - 0.005}%2C${customer.latitude - 0.005}%2C${customer.longitude + 0.005}%2C${customer.latitude + 0.005}&layer=mapnik&marker=${customer.latitude}%2C${customer.longitude}`"
                    width="100%"
                    height="200"
                    style="border: 0"
                    loading="lazy"
                  ></iframe>
                </div>
              </div>
              <div v-if="customer?.notes">
                <p class="text-sm text-base-content/60">Catatan</p>
                <p class="text-sm">{{ customer.notes }}</p>
              </div>
              <div>
                <p class="text-sm text-base-content/60">Total Proyek</p>
                <p class="font-semibold">{{ customer?._count?.projects || 0 }}</p>
              </div>
            </div>

            <!-- Edit Mode -->
            <form v-else @submit.prevent="handleUpdate" class="space-y-4 mt-2">
              <!-- Nama -->
              <div class="form-control w-full">
                <label class="label pb-1">
                  <span class="label-text font-semibold">
                    Nama Pelanggan
                    <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  v-model="form.name"
                  type="text"
                  placeholder="Masukkan nama"
                  class="input input-bordered input-sm w-full"
                  required
                />
              </div>

              <!-- Perusahaan -->
              <div class="form-control w-full">
                <label class="label pb-1">
                  <span class="label-text font-semibold">Nama Perusahaan</span>
                </label>
                <input
                  v-model="form.companyName"
                  type="text"
                  placeholder="Opsional"
                  class="input input-bordered input-sm w-full"
                />
              </div>

              <!-- Telepon -->
              <div class="form-control w-full">
                <label class="label pb-1">
                  <span class="label-text font-semibold">
                    Nomor Telepon
                    <span class="text-error">*</span>
                  </span>
                </label>
                <input
                  v-model="form.phone"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  class="input input-bordered input-sm w-full"
                  required
                />
              </div>

              <!-- Email -->
              <div class="form-control w-full">
                <label class="label pb-1">
                  <span class="label-text font-semibold">Email</span>
                </label>
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="Opsional"
                  class="input input-bordered input-sm w-full"
                />
              </div>

              <!-- Alamat -->
              <div class="form-control w-full">
                <label class="label pb-1">
                  <span class="label-text font-semibold">
                    Alamat
                    <span class="text-error">*</span>
                  </span>
                </label>
                <textarea
                  v-model="form.address"
                  placeholder="Masukkan alamat lengkap"
                  class="textarea textarea-bordered textarea-sm w-full h-20 resize-none"
                  required
                ></textarea>
              </div>

              <!-- Catatan -->
              <div class="form-control w-full">
                <label class="label pb-1">
                  <span class="label-text font-semibold">Catatan</span>
                </label>
                <textarea
                  v-model="form.notes"
                  placeholder="Catatan tambahan (opsional)"
                  class="textarea textarea-bordered textarea-sm w-full h-16 resize-none"
                ></textarea>
              </div>

              <!-- Koordinat dengan Map Picker -->
              <div class="form-control w-full">
                <label class="label pb-1">
                  <span class="label-text font-semibold">Lokasi</span>
                </label>
                <ClientOnly>
                  <MapLocationPicker v-model="mapLocation" />
                  <template #fallback>
                    <div
                      class="h-64 bg-base-200 rounded-lg animate-pulse flex items-center justify-center"
                    >
                      <span class="loading loading-spinner"></span>
                    </div>
                  </template>
                </ClientOnly>

                <!-- Manual Coordinate Input -->
                <div class="flex gap-2 mt-2">
                  <div class="flex-1">
                    <label class="label py-0"><span class="label-text-alt">Latitude</span></label>
                    <input
                      v-model.number="form.latitude"
                      type="number"
                      step="0.000001"
                      placeholder="-6.175110"
                      class="input input-bordered input-sm w-full font-mono"
                    />
                  </div>
                  <div class="flex-1">
                    <label class="label py-0"><span class="label-text-alt">Longitude</span></label>
                    <input
                      v-model.number="form.longitude"
                      type="number"
                      step="0.000001"
                      placeholder="106.865039"
                      class="input input-bordered input-sm w-full font-mono"
                    />
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="divider my-1"></div>

              <!-- Action Buttons -->
              <div class="flex gap-2">
                <button type="button" @click="cancelEdit" class="btn btn-ghost btn-sm flex-1">
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
                  Batal
                </button>
                <button type="submit" class="btn btn-primary btn-sm flex-1" :disabled="updating">
                  <span v-if="updating" class="loading loading-spinner loading-xs"></span>
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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Project History -->
      <div class="lg:col-span-2">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Riwayat Proyek</h2>

            <div v-if="customer?.projects?.length" class="space-y-3">
              <div
                v-for="project in customer.projects"
                :key="project.id"
                class="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors cursor-pointer"
                @click="navigateTo(`/projects/${project.id}`)"
              >
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-sm text-base-content/60">
                      {{ project.projectNumber }}
                    </span>
                    <span class="badge badge-sm" :class="getStatusClass(project.status)">
                      {{ getStatusLabel(project.status) }}
                    </span>
                  </div>
                  <p class="font-medium">{{ project.title }}</p>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{{ formatCurrency(project.budget) }}</p>
                  <p class="text-xs text-base-content/60">{{ formatDate(project.createdAt) }}</p>
                </div>
              </div>
            </div>

            <div v-else class="text-center py-8 text-base-content/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 mx-auto mb-2 opacity-50"
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
              <p>Belum ada proyek</p>
              <NuxtLink
                :to="`/quotations/create?customerId=${customer?.id}`"
                class="btn btn-primary btn-sm mt-4"
              >
                Buat Penawaran Pertama
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Device Credentials -->
        <div class="card bg-base-100 shadow mt-6">
          <div class="card-body">
            <div class="flex justify-between items-center">
              <h2 class="card-title">Device Credentials</h2>
              <button @click="openCredentialModal()" class="btn btn-primary btn-sm gap-1">
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Tambah
              </button>
            </div>

            <div v-if="credentials?.length" class="overflow-x-auto mt-4">
              <table class="table table-sm">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>IP Address</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Port</th>
                    <th>Gambar</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cred in credentials" :key="cred.id">
                    <td>
                      <div class="font-medium">{{ cred.deviceName }}</div>
                      <div v-if="cred.deviceType" class="text-xs text-base-content/60">
                        {{ cred.deviceType }}
                      </div>
                    </td>
                    <td class="font-mono text-sm">{{ cred.ipAddress || '-' }}</td>
                    <td class="font-mono text-sm">{{ cred.username }}</td>
                    <td>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-sm">
                          {{ showPassword[cred.id] ? cred.password : '••••••••' }}
                        </span>
                        <button
                          type="button"
                          @click="showPassword[cred.id] = !showPassword[cred.id]"
                          class="btn btn-ghost btn-xs btn-circle"
                        >
                          <svg
                            v-if="!showPassword[cred.id]"
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
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
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          @click="copyToClipboard(cred.password)"
                          class="btn btn-ghost btn-xs btn-circle"
                          title="Copy"
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
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td class="font-mono text-sm">{{ cred.port || '-' }}</td>
                    <td>
                      <div v-if="cred.image" class="relative group">
                        <img
                          :src="cred.image"
                          alt="QR"
                          class="w-10 h-10 object-cover rounded cursor-pointer hover:opacity-80"
                          @click="viewImage = cred.image"
                        />
                      </div>
                      <span v-else class="text-base-content/40">-</span>
                    </td>
                    <td>
                      <div class="flex gap-1">
                        <button @click="openCredentialModal(cred)" class="btn btn-ghost btn-xs">
                          Edit
                        </button>
                        <button
                          @click="deleteCredential(cred.id)"
                          class="btn btn-ghost btn-xs text-error"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="text-center py-6 text-base-content/60">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-10 w-10 mx-auto mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              <p class="text-sm">Belum ada credential tersimpan</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Credential Modal -->
    <dialog class="modal" :class="{ 'modal-open': showCredentialModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{ editingCredential ? 'Edit' : 'Tambah' }} Credential
        </h3>

        <form @submit.prevent="saveCredential">
          <div class="space-y-3">
            <div class="form-control w-full">
              <label class="label"><span class="label-text">Nama Device *</span></label>
              <input
                v-model="credentialForm.deviceName"
                type="text"
                class="input input-bordered input-sm w-full"
                placeholder="Router Utama, DVR, Camera 1"
                required
              />
            </div>

            <div class="form-control w-full">
              <label class="label"><span class="label-text">Tipe Device</span></label>
              <select
                v-model="credentialForm.deviceType"
                class="select select-bordered select-sm w-full"
              >
                <option value="">Pilih tipe</option>
                <option value="ROUTER">Router</option>
                <option value="DVR">DVR</option>
                <option value="NVR">NVR</option>
                <option value="IP_CAMERA">IP Camera</option>
                <option value="SWITCH">Switch</option>
                <option value="ACCESS_POINT">Access Point</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="form-control w-full">
                <label class="label"><span class="label-text">IP Address</span></label>
                <input
                  v-model="credentialForm.ipAddress"
                  type="text"
                  class="input input-bordered input-sm w-full"
                  placeholder="192.168.1.1"
                />
              </div>
              <div class="form-control w-full">
                <label class="label"><span class="label-text">Port</span></label>
                <input
                  v-model="credentialForm.port"
                  type="text"
                  class="input input-bordered input-sm w-full"
                  placeholder="80, 8080, 554"
                />
              </div>
            </div>

            <div class="form-control w-full">
              <label class="label"><span class="label-text">Username *</span></label>
              <input
                v-model="credentialForm.username"
                type="text"
                class="input input-bordered input-sm w-full"
                placeholder="admin"
                required
              />
            </div>

            <div class="form-control w-full">
              <label class="label"><span class="label-text">Password *</span></label>
              <input
                v-model="credentialForm.password"
                type="text"
                class="input input-bordered input-sm w-full"
                required
              />
            </div>

            <!-- Image Upload -->
            <div class="form-control w-full">
              <label class="label"><span class="label-text">QR Code / Gambar Device</span></label>
              <div class="flex items-start gap-3">
                <div v-if="credentialForm.image" class="relative">
                  <img
                    :src="credentialForm.image"
                    alt="Device Image"
                    class="w-24 h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    @click="credentialForm.image = ''"
                    class="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error"
                  >
                    ✕
                  </button>
                </div>
                <div class="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    @change="handleImageUpload"
                    class="file-input file-input-bordered file-input-sm w-full"
                    :disabled="uploadingImage"
                  />
                  <span
                    v-if="uploadingImage"
                    class="text-xs text-base-content/60 mt-1 flex items-center gap-1"
                  >
                    <span class="loading loading-spinner loading-xs"></span>
                    Mengupload...
                  </span>
                </div>
              </div>
            </div>

            <div class="form-control w-full">
              <label class="label"><span class="label-text">Catatan</span></label>
              <textarea
                v-model="credentialForm.notes"
                class="textarea textarea-bordered textarea-sm w-full"
                placeholder="Catatan tambahan"
              ></textarea>
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn btn-ghost btn-sm" @click="showCredentialModal = false">
              Batal
            </button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="savingCredential">
              <span v-if="savingCredential" class="loading loading-spinner loading-xs"></span>
              Simpan
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCredentialModal = false">close</button>
      </form>
    </dialog>

    <!-- Image Viewer Modal -->
    <dialog class="modal" :class="{ 'modal-open': viewImage }">
      <div class="modal-box max-w-2xl">
        <img v-if="viewImage" :src="viewImage" alt="Device Image" class="w-full rounded-lg" />
        <div class="modal-action">
          <button type="button" class="btn" @click="viewImage = ''">Tutup</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="viewImage = ''">close</button>
      </form>
    </dialog>

    <!-- Delete Confirmation Modal -->
    <dialog class="modal" :class="{ 'modal-open': credentialToDelete }">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error">Hapus Credential</h3>
        <p class="py-4">
          Apakah Anda yakin ingin menghapus credential ini? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div class="modal-action">
          <button class="btn" @click="credentialToDelete = null" :disabled="deletingCredential">
            Batal
          </button>
          <button
            class="btn btn-error"
            @click="executeDeleteCredential"
            :disabled="deletingCredential"
          >
            <span v-if="deletingCredential" class="loading loading-spinner loading-xs"></span>
            Hapus
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { formatCurrency, formatDate } = useFormatter()
const { success, error: showError } = useAlert()

const { data: customer, refresh } = await useFetch(`/api/customers/${route.params.id}`)

const isEditing = ref(false)
const updating = ref(false)

const form = reactive({
  name: '',
  companyName: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
  latitude: null as number | null,
  longitude: null as number | null,
})

const populateForm = () => {
  if (customer.value) {
    form.name = customer.value.name
    form.companyName = customer.value.companyName || ''
    form.phone = customer.value.phone
    form.email = customer.value.email || ''
    form.address = customer.value.address
    form.notes = customer.value.notes || ''
    form.latitude = customer.value.latitude || null
    form.longitude = customer.value.longitude || null
  }
}

watch(isEditing, val => {
  if (val) populateForm()
})

const cancelEdit = () => {
  isEditing.value = false
  populateForm()
}

const handleUpdate = async () => {
  updating.value = true
  try {
    await $fetch(`/api/customers/${route.params.id}`, {
      method: 'PUT',
      body: form,
    })
    success('Pelanggan berhasil diperbarui')
    isEditing.value = false
    refresh()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal memperbarui pelanggan')
  } finally {
    updating.value = false
  }
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    QUOTATION: 'badge-ghost',
    APPROVED: 'badge-info',
    PROCUREMENT: 'badge-warning',
    ONGOING: 'badge-primary',
    COMPLETED: 'badge-success',
    PAID: 'badge-success',
    CLOSED: 'badge-neutral',
  }
  return classes[status] || 'badge-ghost'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    QUOTATION: 'Penawaran',
    APPROVED: 'Disetujui',
    PROCUREMENT: 'Pengadaan',
    ONGOING: 'Dikerjakan',
    COMPLETED: 'Selesai',
    PAID: 'Lunas',
    CLOSED: 'Ditutup',
  }
  return labels[status] || status
}

// Map location for MapLocationPicker
const mapLocation = computed({
  get: () => ({
    latitude: form.latitude,
    longitude: form.longitude,
  }),
  set: (val: { latitude: number | null; longitude: number | null }) => {
    form.latitude = val.latitude
    form.longitude = val.longitude
  },
})

// Credentials
const { data: credentials, refresh: refreshCredentials } = await useFetch(
  `/api/customers/${route.params.id}/credentials`
)

const showCredentialModal = ref(false)
const editingCredential = ref<any>(null)
const savingCredential = ref(false)
const uploadingImage = ref(false)
const viewImage = ref('')
const showPassword = reactive<Record<string, boolean>>({})

const credentialForm = reactive({
  deviceName: '',
  deviceType: '',
  ipAddress: '',
  username: '',
  password: '',
  port: '',
  image: '',
  notes: '',
})

const handleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]
  uploadingImage.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)

    const result = await $fetch<{ url: string }>('/api/upload', {
      method: 'POST',
      body: formData,
    })

    credentialForm.image = result.url
  } catch (err: any) {
    showError(err.data?.message || 'Gagal mengupload gambar')
  } finally {
    uploadingImage.value = false
    input.value = ''
  }
}

const resetCredentialForm = () => {
  credentialForm.deviceName = ''
  credentialForm.deviceType = ''
  credentialForm.ipAddress = ''
  credentialForm.username = ''
  credentialForm.password = ''
  credentialForm.port = ''
  credentialForm.image = ''
  credentialForm.notes = ''
  editingCredential.value = null
}

const openCredentialModal = (cred?: any) => {
  if (cred) {
    editingCredential.value = cred
    credentialForm.deviceName = cred.deviceName
    credentialForm.deviceType = cred.deviceType || ''
    credentialForm.ipAddress = cred.ipAddress || ''
    credentialForm.username = cred.username
    credentialForm.password = cred.password
    credentialForm.port = cred.port || ''
    credentialForm.image = cred.image || ''
    credentialForm.notes = cred.notes || ''
  } else {
    resetCredentialForm()
  }
  showCredentialModal.value = true
}

const saveCredential = async () => {
  savingCredential.value = true
  try {
    if (editingCredential.value) {
      await $fetch(`/api/customers/${route.params.id}/credentials/${editingCredential.value.id}`, {
        method: 'PUT',
        body: credentialForm,
      })
      success('Credential berhasil diperbarui')
    } else {
      await $fetch(`/api/customers/${route.params.id}/credentials`, {
        method: 'POST',
        body: credentialForm,
      })
      success('Credential berhasil ditambahkan')
    }
    showCredentialModal.value = false
    resetCredentialForm()
    refreshCredentials()
  } catch (err: any) {
    showError(err.data?.message || 'Gagal menyimpan credential')
  } finally {
    savingCredential.value = false
  }
}

const credentialToDelete = ref<string | null>(null)
const deletingCredential = ref(false)

const deleteCredential = (id: string) => {
  credentialToDelete.value = id
}

const executeDeleteCredential = async () => {
  if (!credentialToDelete.value) return

  deletingCredential.value = true
  try {
    await $fetch(`/api/customers/${route.params.id}/credentials/${credentialToDelete.value}`, {
      method: 'DELETE',
    })
    success('Credential berhasil dihapus')
    refreshCredentials()
    credentialToDelete.value = null
  } catch (err: any) {
    showError(err.data?.message || 'Gagal menghapus credential')
  } finally {
    deletingCredential.value = false
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    success('Password disalin')
  } catch {
    showError('Gagal menyalin')
  }
}
</script>
