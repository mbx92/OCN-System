/**
 * Activity Logger Utility
 * Helper functions to log user activities
 */

interface LogActivityParams {
  userId: string
  action: string
  entity?: string
  entityId?: string
  metadata?: any
  ipAddress?: string
}

/**
 * Log an activity
 */
export async function logActivity(params: LogActivityParams) {
  const { prisma } = await import('./prisma')

  try {
    await prisma.activity.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity || null,
        entityId: params.entityId || null,
        metadata: params.metadata || null,
        ipAddress: params.ipAddress || 'unknown',
      },
    })
  } catch (error) {
    console.error('[Logger] Failed to log activity:', error)
  }
}

/**
 * Common action types for consistency
 */
export const ActivityAction = {
  // Auth
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',

  // CRUD operations
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  VIEW: 'VIEW',

  // Project specific
  CREATE_PROJECT: 'CREATE_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  APPROVE_PROJECT: 'APPROVE_PROJECT',
  COMPLETE_PROJECT: 'COMPLETE_PROJECT',

  // Payment
  CREATE_PAYMENT: 'CREATE_PAYMENT',
  DELETE_PAYMENT: 'DELETE_PAYMENT',

  // PO
  CREATE_PO: 'CREATE_PO',
  SEND_PO: 'SEND_PO',
  RECEIVE_PO: 'RECEIVE_PO',

  // Quotation
  CREATE_QUOTATION: 'CREATE_QUOTATION',
  APPROVE_QUOTATION: 'APPROVE_QUOTATION',

  // Asset
  CREATE_ASSET: 'CREATE_ASSET',
  UPDATE_ASSET: 'UPDATE_ASSET',
  DELETE_ASSET: 'DELETE_ASSET',

  // Expense
  CREATE_EXPENSE: 'CREATE_EXPENSE',
  UPDATE_EXPENSE: 'UPDATE_EXPENSE',
  DELETE_EXPENSE: 'DELETE_EXPENSE',

  // Settings
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  UPDATE_COMPANY: 'UPDATE_COMPANY',
} as const

/**
 * Common entity types
 */
export const ActivityEntity = {
  USER: 'User',
  PROJECT: 'Project',
  QUOTATION: 'Quotation',
  PAYMENT: 'Payment',
  PURCHASE_ORDER: 'PurchaseOrder',
  CUSTOMER: 'Customer',
  PRODUCT: 'Product',
  SUPPLIER: 'Supplier',
  ASSET: 'Asset',
  EXPENSE: 'Expense',
  TECHNICIAN: 'Technician',
  MAINTENANCE: 'MaintenanceSchedule',
  PACKAGE: 'Package',
} as const
