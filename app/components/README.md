# Komponen Searchable Select

Sistem OCN memiliki beberapa komponen searchable select yang memudahkan pencarian data:

## 1. AppSearchableSelect

Komponen generic searchable select yang bisa digunakan untuk berbagai jenis data.

### Props:

- `modelValue` (string): Value yang dipilih
- `options` (Array): Array of options dengan format `{ value, label, ...otherFields }`
- `placeholder` (string): Placeholder text
- `inputClass` (string): Custom CSS class untuk input
- `required` (boolean): Apakah field wajib diisi
- `searchFields` (array): Field mana saja yang akan di-search (default: ['label'])

### Slots:

- `option`: Custom render untuk setiap option

### Contoh Penggunaan:

```vue
<AppSearchableSelect
  v-model="form.projectId"
  :options="projectOptions"
  placeholder="Cari proyek..."
  :search-fields="['label', 'projectNumber', 'title']"
>
  <template #option="{ option }">
    <div>
      <div class="font-medium">{{ option.projectNumber }}</div>
      <div class="text-xs opacity-70">{{ option.title }}</div>
    </div>
  </template>
</AppSearchableSelect>
```

## 2. AppCustomerSelect

Komponen khusus untuk memilih customer dengan fitur search.

### Props:

- `modelValue` (string): Customer ID yang dipilih
- `placeholder` (string): Placeholder text (default: 'Pilih Customer...')
- `required` (boolean): Apakah field wajib diisi

### Events:

- `update:modelValue`: Emit ketika customer dipilih
- `select`: Emit customer object yang dipilih

### Fitur:

- Auto-fetch semua customer dari API
- Search berdasarkan nama, nama perusahaan, telepon, dan email
- Tampilan detail customer (nama, perusahaan, kontak)
- Tombol clear selection (X)
- Keyboard navigation (arrow up/down, enter, escape)

### Contoh Penggunaan:

```vue
<AppCustomerSelect v-model="form.customerId" placeholder="Cari customer..." required />
```

## 3. AppProjectSelect

Komponen khusus untuk memilih project dengan fitur search dan detail project.

### Props:

- `modelValue` (string): Project ID yang dipilih
- `placeholder` (string): Placeholder text

### Events:

- `update:modelValue`: Emit ketika project dipilih
- `select`: Emit project object yang dipilih
- `clear`: Emit ketika selection di-clear

### Fitur:

- Auto-fetch projects dari API dengan debounce
- Search berdasarkan nomor project, title, dan customer name
- Tampilan detail: nomor project, title, customer, total, status pembayaran
- Tombol clear selection (X)
- Loading indicator saat search

### Contoh Penggunaan:

```vue
<AppProjectSelect v-model="form.projectId" placeholder="Cari project..." />
```

## 4. AppProductSelect

Komponen khusus untuk memilih product dengan fitur search dan detail product.

### Props:

- `modelValue` (string): Product ID yang dipilih
- `placeholder` (string): Placeholder text

### Events:

- `update:modelValue`: Emit ketika product dipilih
- `select`: Emit product object yang dipilih
- `clear`: Emit ketika selection di-clear

### Fitur:

- Auto-fetch products dari API dengan debounce
- Search berdasarkan nama product dan SKU
- Tampilan detail: nama, SKU, harga jual, stok
- Tombol clear selection (X)
- Loading indicator saat search

### Contoh Penggunaan:

```vue
<AppProductSelect
  v-model="form.productId"
  placeholder="Cari produk..."
  @select="handleProductSelect"
/>
```

## Tips Penggunaan

1. **Untuk data customer**: Gunakan `AppCustomerSelect`
2. **Untuk data project**: Gunakan `AppProjectSelect`
3. **Untuk data product**: Gunakan `AppProductSelect`
4. **Untuk data lainnya**: Gunakan `AppSearchableSelect` dengan custom options

## Fitur Umum Semua Komponen

- ✅ Search/filter real-time
- ✅ Keyboard navigation (arrow keys, enter, escape)
- ✅ Click outside to close
- ✅ Clear selection
- ✅ Responsive design
- ✅ Loading states
- ✅ No results message
- ✅ Accessible (keyboard friendly)
