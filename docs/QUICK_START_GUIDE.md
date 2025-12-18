# Quick Start Development Guide

## 🚀 Day 1-3: Foundation

```bash
# Setup
npx nuxi@latest init cctv-management
cd cctv-management
npm install @tailwindcss/forms daisyui@latest prisma @prisma/client
npm install dayjs zod @vueuse/nuxt @pinia/nuxt

# Initialize Prisma
npx prisma init

# Copy schema from PROJECT_BRIEF.md to prisma/schema.prisma
# Setup PostgreSQL connection in .env
DATABASE_URL="postgresql://user:password@localhost:5432/cctv_db"

# Generate Prisma Client
npx prisma migrate dev --name init
```

## 📁 Project Structure Setup

```
nuxt. config.ts - Add modules:  tailwind, daisyui, pinia
server/api/ - API endpoints
composables/ - Shared logic
components/ - Reusable components
pages/ - Route pages
stores/ - Pinia stores
utils/ - Helper functions
```

## 🎯 Week 1 Priorities

1. ✅ Database setup & migration
2. ✅ Authentication (simple login)
3. ✅ Customer CRUD
4. ✅ Quotation builder
5. ✅ Project creation from quotation
6. ✅ Basic inventory

## 🎯 Week 2 Priorities

1. ✅ PO system
2. ✅ Expense tracking
3. ✅ Payment recording
4. ✅ Fee calculation
5. ✅ Dashboard
6. ✅ Basic reports

## 🔑 Key API Endpoints

```typescript
// Priority endpoints
POST / api / auth / login
GET / api / dashboard / summary

// Customers
GET / api / customers
POST / api / customers
GET / api / customers / [id]
PUT / api / customers / [id]

// Quotations
GET / api / quotations
POST / api / quotations
PUT / api / quotations / [id] / approve

// Projects
GET / api / projects
POST / api / projects
GET / api / projects / [id] / details
PUT / api / projects / [id] / status
POST / api / projects / [id] / expenses
POST / api / projects / [id] / payments

// Inventory
GET / api / products
GET / api / stock / check
POST / api / stock / reserve

// Purchase Orders
POST / api / purchase - orders
PUT / api / purchase - orders / [id] / receive

// Financial
GET / api / projects / [id] / financial - summary
POST / api / projects / [id] / calculate - fees
```

## 💡 Component Templates

### Quick Quotation Builder

```vue
<template>
  <div class="space-y-4">
    <div v-for="item in items" class="flex gap-2">
      <select v-model="item.productId" class="select select-bordered">
        <option value="">Custom Item</option>
        <option v-for="p in products" :value="p.id">{{ p.name }}</option>
      </select>
      <input v-model="item.quantity" type="number" class="input input-bordered w-20" />
      <input v-model="item.price" type="number" class="input input-bordered" />
      <button @click="removeItem(index)" class="btn btn-error btn-sm">X</button>
    </div>
    <button @click="addItem" class="btn btn-primary">Add Item</button>
    <div class="text-xl font-bold">Total: {{ formatCurrency(total) }}</div>
  </div>
</template>
```

### Fee Calculator Component

```vue
<template>
  <div class="card bg-base-100">
    <div class="card-body">
      <h3 class="card-title">Fee Distribution</h3>
      <div class="space-y-2">
        <div>Revenue: {{ formatCurrency(revenue) }}</div>
        <div>Total Cost: {{ formatCurrency(cost) }}</div>
        <div class="divider"></div>
        <div class="font-bold">Margin: {{ formatCurrency(margin) }}</div>
        <div>Technician Fee: {{ formatCurrency(techFee) }}</div>
        <div>Company Fund (35%): {{ formatCurrency(companyFund) }}</div>
        <div>Net Profit: {{ formatCurrency(netProfit) }}</div>
      </div>
    </div>
  </div>
</template>
```

## 🎨 DaisyUI Theme Config

```javascript
// tailwind.config.js
module.exports = {
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#F59E0B',
          neutral: '#374151',
          'base-100': '#FFFFFF',
          info: '#06B6D4',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        },
      },
    ],
  },
}
```

## 🔧 Utility Functions

```typescript
// utils/format.ts
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

export const generateProjectNumber = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')
  return `PRJ-${year}${month}-${random}`
}
```

## ⚡ Performance Tips

1. Use `lazy` prefix for non-critical components
2. Implement virtual scrolling for long lists
3. Use `useFetch` with proper caching
4. Debounce search inputs (300ms)
5. Compress images before upload

## 🐛 Common Issues & Solutions

1. **CORS issues**: Configure server/api with proper headers
2. **Decimal handling**: Use Prisma Decimal type, convert to number in frontend
3. **Date timezone**: Store in UTC, display in local
4. **Currency input**: Use input mask for better UX

## 📱 Mobile Responsive Checklist

- [ ] Touch-friendly buttons (min 44x44px)
- [ ] Responsive tables (use cards on mobile)
- [ ] Bottom navigation for mobile
- [ ] Swipe gestures for navigation
- [ ] Optimized images

## 🚢 Deployment Checklist

- [ ] Environment variables set
- [ ] Database migrations run
- [ ] SSL certificate configured
- [ ] Backup system in place
- [ ] Error tracking setup (Sentry)
- [ ] Analytics (optional)

Remember: SHIP FAST, ITERATE LATER! 🚀
