# Authentication & Role Management System

## 🔐 User Authentication Structure

### Updated Database Schema for Users

```prisma
// Add to existing schema

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String    @unique
  password      String    // Hashed with bcrypt
  name          String
  phone         String?
  role          UserRole  @default(TECHNICIAN)
  isActive      Boolean   @default(true)
  
  // Relations
  technicianProfile  Technician?  @relation("UserTechnician")
  activities         Activity[]
  sessions          Session[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum UserRole {
  OWNER         // Full access (you)
  ADMIN         // Future: administrative staff
  TECHNICIAN    // Limited access to their projects
  VIEWER        // Future: read-only access
}

model Technician {
  id            String    @id @default(cuid())
  userId        String    @unique
  user          User      @relation("UserTechnician", fields: [userId], references: [id])
  name          String
  phone         String
  type          String    @default("FREELANCE")
  feeType       String    @default("PERCENTAGE")
  feePercentage Decimal? 
  minFee        Decimal   @default(150000)
  assignments   ProjectTechnician[]
  
  // Dashboard access
  canViewProjects    Boolean  @default(true)
  canViewEarnings    Boolean  @default(true)
  canUpdateStatus    Boolean  @default(false)  // Future feature
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields:  [userId], references: [id])
  token        String   @unique
  userAgent    String? 
  ipAddress    String?
  lastActivity DateTime @default(now())
  expiresAt    DateTime
  createdAt    DateTime @default(now())
}

model Activity {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String   // LOGIN, VIEW_PROJECT, UPDATE_STATUS, etc
  entity      String?   // projects, payments, etc
  entityId    String?
  metadata    Json?
  ipAddress   String?
  createdAt   DateTime @default(now())
}
```

## 🎯 Authentication Flow

### 1. Login System

```typescript
// server/api/auth/login.post.ts
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event)
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { 
      OR: [
        { email: username },
        { username: username }
      ]
    },
    include: {
      technicianProfile: true
    }
  })
  
  if (!user || !user.isActive) {
    throw createError({
      statusCode:  401,
      statusMessage:  'Invalid credentials'
    })
  }
  
  // Verify password
  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid credentials'
    })
  }
  
  // Generate token
  const token = jwt.sign(
    { 
      userId: user.id,
      role: user.role,
      technicianId: user.technicianProfile?.id
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
  
  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      userAgent: getHeader(event, 'user-agent'),
      ipAddress: getClientIP(event),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  })
  
  // Log activity
  await prisma.activity.create({
    data: {
      userId: user.id,
      action: 'LOGIN',
      ipAddress: getClientIP(event)
    }
  })
  
  return {
    user: {
      id: user. id,
      name: user.name,
      email: user.email,
      role: user.role,
      technicianId: user.technicianProfile?.id
    },
    token
  }
})
```

### 2. Middleware for Protected Routes

```typescript
// server/middleware/auth.ts
import jwt from 'jsonwebtoken'

export async function verifyAuth(event) {
  const token = getCookie(event, 'auth-token') || getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({
      statusCode:  401,
      statusMessage:  'No token provided'
    })
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    
    // Check session validity
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    })
    
    if (!session || session.expiresAt < new Date()) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Session expired'
      })
    }
    
    // Update last activity
    await prisma. session.update({
      where: { id: session.id },
      data: { lastActivity: new Date() }
    })
    
    event.context.user = session.user
    event.context.session = session
    
    return session.user
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid token'
    })
  }
}
```

## 🛡️ Role-Based Access Control (RBAC)

### Permission Matrix

| Feature | OWNER | ADMIN | TECHNICIAN | VIEWER |
|---------|-------|-------|------------|--------|
| **Dashboard** |
| View full dashboard | ✅ | ✅ | ❌ | ✅ |
| View technician dashboard | ✅ | ✅ | ✅ | ❌ |
| **Customers** |
| View all | ✅ | ✅ | ❌ | ✅ |
| Create/Edit | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| **Projects** |
| View all | ✅ | ✅ | ❌ | ✅ |
| View assigned | ✅ | ✅ | ✅ | ❌ |
| Create/Edit | ✅ | ✅ | ❌ | ❌ |
| Update status | ✅ | ✅ | 🔶 | ❌ |
| **Financial** |
| View all finances | ✅ | ✅ | ❌ | ❌ |
| View own earnings | ✅ | ✅ | ✅ | ❌ |
| Manage payments | ✅ | ✅ | ❌ | ❌ |
| **Inventory** |
| View | ✅ | ✅ | ✅ | ✅ |
| Manage | ✅ | ✅ | ❌ | ❌ |
| **Reports** |
| Full reports | ✅ | ✅ | ❌ | ❌ |
| Own performance | ✅ | ✅ | ✅ | ❌ |

🔶 = Limited (e.g., can update work status only)

### Access Control Implementation

```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const user = useState('auth.user')
  
  const hasRole = (roles: UserRole[]) => {
    return roles.includes(user. value?.role)
  }
  
  const canAccess = (feature: string) => {
    const permissions = {
      'customers.view': ['OWNER', 'ADMIN', 'VIEWER'],
      'customers.edit': ['OWNER', 'ADMIN'],
      'customers.delete': ['OWNER'],
      'projects.view. all': ['OWNER', 'ADMIN', 'VIEWER'],
      'projects.view. assigned': ['OWNER', 'ADMIN', 'TECHNICIAN'],
      'projects.edit': ['OWNER', 'ADMIN'],
      'finance.view.all': ['OWNER', 'ADMIN'],
      'finance.view.own': ['OWNER', 'ADMIN', 'TECHNICIAN'],
      'inventory.manage': ['OWNER', 'ADMIN'],
      'reports.full': ['OWNER', 'ADMIN'],
      'reports.own': ['OWNER', 'ADMIN', 'TECHNICIAN']
    }
    
    return hasRole(permissions[feature] || [])
  }
  
  const isTechnician = () => user.value?.role === 'TECHNICIAN'
  const isOwner = () => user.value?.role === 'OWNER'
  const isAdmin = () => user.value?.role === 'ADMIN'
  
  return {
    user:  readonly(user),
    hasRole,
    canAccess,
    isTechnician,
    isOwner,
    isAdmin
  }
}
```

## 👷 Technician Portal

### Technician Dashboard View

```vue
<!-- pages/technician/dashboard.vue -->
<template>
  <div class="container mx-auto p-4">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold">Welcome, {{ user.name }}</h1>
      <p class="text-gray-600">Your work dashboard</p>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="stat bg-base-100 shadow">
        <div class="stat-title">Active Projects</div>
        <div class="stat-value">{{ stats.activeProjects }}</div>
      </div>
      
      <div class="stat bg-base-100 shadow">
        <div class="stat-title">This Month Earnings</div>
        <div class="stat-value text-success">{{ formatCurrency(stats.monthlyEarnings) }}</div>
      </div>
      
      <div class="stat bg-base-100 shadow">
        <div class="stat-title">Pending Payment</div>
        <div class="stat-value text-warning">{{ formatCurrency(stats.pendingPayment) }}</div>
      </div>
      
      <div class="stat bg-base-100 shadow">
        <div class="stat-title">Total Projects</div>
        <div class="stat-value">{{ stats. totalProjects }}</div>
      </div>
    </div>
    
    <!-- My Projects -->
    <div class="card bg-base-100 shadow-xl mb-6">
      <div class="card-body">
        <h2 class="card-title">My Projects</h2>
        
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Project No</th>
                <th>Customer</th>
                <th>Status</th>
                <th>My Fee</th>
                <th>Payment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="project in myProjects" :key="project. id">
                <td>{{ project.projectNumber }}</td>
                <td>{{ project.customer.name }}</td>
                <td>
                  <span class="badge" :class="getStatusBadge(project.status)">
                    {{ project.status }}
                  </span>
                </td>
                <td>{{ formatCurrency(project.technicianFee) }}</td>
                <td>
                  <span class="badge" :class="project.isPaid ? 'badge-success' : 'badge-warning'">
                    {{ project.isPaid ? 'Paid' : 'Pending' }}
                  </span>
                </td>
                <td>
                  <button @click="viewProject(project. id)" class="btn btn-sm btn-primary">
                    View
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Earnings History -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title">Earnings History</h2>
        
        <div class="space-y-2">
          <div v-for="earning in earningsHistory" : key="earning.id" 
               class="flex justify-between items-center p-3 bg-base-200 rounded">
            <div>
              <div class="font-semibold">{{ earning.projectNumber }}</div>
              <div class="text-sm text-gray-600">{{ formatDate(earning.date) }}</div>
            </div>
            <div class="text-right">
              <div class="font-bold text-success">{{ formatCurrency(earning. amount) }}</div>
              <div class="text-sm">
                <span class="badge badge-sm" :class="earning.isPaid ? 'badge-success' : 'badge-warning'">
                  {{ earning.isPaid ? `Paid ${formatDate(earning.paidDate)}` : 'Pending' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Middleware to check if user is technician
definePageMeta({
  middleware: 'technician-auth'
})

const { user } = useAuth()
const { formatCurrency, formatDate } = useFormatter()

// Fetch technician-specific data
const { data: stats } = await useFetch('/api/technician/stats')
const { data: myProjects } = await useFetch('/api/technician/projects')
const { data: earningsHistory } = await useFetch('/api/technician/earnings')

const viewProject = (projectId) => {
  navigateTo(`/technician/projects/${projectId}`)
}

const getStatusBadge = (status) => {
  const badges = {
    'ONGOING': 'badge-primary',
    'COMPLETED': 'badge-success',
    'PENDING': 'badge-warning'
  }
  return badges[status] || 'badge-ghost'
}
</script>
```

### API Endpoints for Technician

```typescript
// server/api/technician/stats.get.ts
export default defineEventHandler(async (event) => {
  const user = await verifyAuth(event)
  
  if (user.role !== 'TECHNICIAN') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied'
    })
  }
  
  const technician = await prisma.technician.findUnique({
    where: { userId: user.id }
  })
  
  // Get statistics
  const stats = await prisma.projectTechnician.aggregate({
    where: { technicianId: technician. id },
    _count: { id: true },
    _sum: { fee: true }
  })
  
  const thisMonth = await prisma.projectTechnician. aggregate({
    where: {
      technicianId: technician. id,
      createdAt:  {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    },
    _sum: { fee: true }
  })
  
  const pending = await prisma.projectTechnician.aggregate({
    where: {
      technicianId:  technician.id,
      isPaid: false
    },
    _sum: { fee:  true }
  })
  
  return {
    activeProjects: stats._count.id || 0,
    totalProjects: stats._count.id || 0,
    monthlyEarnings: thisMonth._sum.fee || 0,
    pendingPayment: pending._sum.fee || 0,
    totalEarnings: stats._sum. fee || 0
  }
})
```

## 🔑 Login Page

```vue
<!-- pages/login.vue -->
<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200">
    <div class="card w-96 bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-center mb-4">CCTV Management System</h2>
        
        <form @submit.prevent="handleLogin">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Username or Email</span>
            </label>
            <input 
              v-model="credentials.username" 
              type="text" 
              class="input input-bordered" 
              required 
            />
          </div>
          
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text">Password</span>
            </label>
            <input 
              v-model="credentials.password" 
              type="password" 
              class="input input-bordered" 
              required 
            />
          </div>
          
          <div v-if="error" class="alert alert-error mb-4">
            <span>{{ error }}</span>
          </div>
          
          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner"></span>
            {{ loading ? 'Logging in.. .' : 'Login' }}
          </button>
        </form>
        
        <div class="divider">OR</div>
        
        <div class="text-center text-sm">
          <p>Demo Accounts:</p>
          <p class="text-gray-600">Owner: owner / demo123</p>
          <p class="text-gray-600">Technician: tech1 / demo123</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout:  false,
  auth: false
})

const credentials = reactive({
  username: '',
  password: ''
})

const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const { data } = await $fetch('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    
    // Store token
    const token = useCookie('auth-token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    token.value = data.token
    
    // Store user in state
    useState('auth.user', () => data.user)
    
    // Redirect based on role
    if (data.user.role === 'TECHNICIAN') {
      await navigateTo('/technician/dashboard')
    } else {
      await navigateTo('/dashboard')
    }
  } catch (err) {
    error.value = err.data?. message || 'Login failed'
  } finally {
    loading. value = false
  }
}
</script>
```

## 🚀 Initial User Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Create owner account
  const ownerPassword = await bcrypt.hash('your-secure-password', 10)
  const owner = await prisma.user.create({
    data: {
      email: 'owner@cctv.com',
      username: 'owner',
      password: ownerPassword,
      name: 'Business Owner',
      role: 'OWNER',
      phone: '081234567890'
    }
  })
  
  // Create technician accounts
  const techPassword = await bcrypt.hash('tech123', 10)
  
  const tech1User = await prisma.user.create({
    data: {
      email: 'tech1@cctv.com',
      username: 'tech1',
      password: techPassword,
      name: 'Teknisi Andi',
      role: 'TECHNICIAN',
      phone: '081234567891'
    }
  })
  
  // Create technician profile
  await prisma. technician.create({
    data: {
      userId: tech1User.id,
      name: 'Teknisi Andi',
      phone: '081234567891',
      type: 'FREELANCE',
      feeType: 'PERCENTAGE',
      feePercentage: 10,
      minFee: 150000,
      canViewProjects: true,
      canViewEarnings: true
    }
  })
  
  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Run seed:
```bash
npx prisma db seed
```

## 📱 Navigation Based on Role

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <!-- Sidebar -->
    <aside class="drawer-side">
      <label for="drawer-toggle" class="drawer-overlay"></label>
      <ul class="menu p-4 w-80 min-h-full bg-base-200">
        <!-- Common menu items -->
        <li><NuxtLink to="/dashboard">Dashboard</NuxtLink></li>
        
        <!-- Owner/Admin only -->
        <template v-if="canAccess('customers.view')">
          <li><NuxtLink to="/customers">Customers</NuxtLink></li>
          <li><NuxtLink to="/quotations">Quotations</NuxtLink></li>
        </template>
        
        <!-- Projects - different views based on role -->
        <li v-if="isTechnician()">
          <NuxtLink to="/technician/projects">My Projects</NuxtLink>
        </li>
        <li v-else-if="canAccess('projects. view.all')">
          <NuxtLink to="/projects">All Projects</NuxtLink>
        </li>
        
        <!-- Technician earnings -->
        <li v-if="isTechnician()">
          <NuxtLink to="/technician/earnings">My Earnings</NuxtLink>
        </li>
        
        <!-- Financial - Owner/Admin only -->
        <template v-if="canAccess('finance.view.all')">
          <li><NuxtLink to="/finance">Finance</NuxtLink></li>
          <li><NuxtLink to="/reports">Reports</NuxtLink></li>
        </template>
        
        <!-- Settings - Owner only -->
        <li v-if="isOwner()">
          <NuxtLink to="/settings">Settings</NuxtLink>
        </li>
        
        <!-- User Management - Owner only -->
        <li v-if="isOwner()">
          <NuxtLink to="/users">User Management</NuxtLink>
        </li>
        
        <li class="mt-auto">
          <button @click="logout" class="btn btn-ghost">Logout</button>
        </li>
      </ul>
    </aside>
  </div>
</template>

<script setup>
const { canAccess, isTechnician, isOwner } = useAuth()

const logout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/login')
}
</script>
```