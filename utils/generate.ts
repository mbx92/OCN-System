import dayjs from 'dayjs'

/**
 * Generate project number: PRJ-YYYYMM-XXX
 */
export const generateProjectNumber = async (getCount: () => Promise<number>): Promise<string> => {
    const date = dayjs()
    const year = date.format('YYYY')
    const month = date.format('MM')
    const count = await getCount()
    const number = String(count + 1).padStart(3, '0')
    return `PRJ-${year}${month}-${number}`
}

/**
 * Generate quotation number: QT-YYYYMM-XXX
 */
export const generateQuotationNumber = async (getCount: () => Promise<number>): Promise<string> => {
    const date = dayjs()
    const year = date.format('YYYY')
    const month = date.format('MM')
    const count = await getCount()
    const number = String(count + 1).padStart(3, '0')
    return `QT-${year}${month}-${number}`
}

/**
 * Generate PO number: PO-YYYYMM-XXX
 */
export const generatePONumber = async (getCount: () => Promise<number>): Promise<string> => {
    const date = dayjs()
    const year = date.format('YYYY')
    const month = date.format('MM')
    const count = await getCount()
    const number = String(count + 1).padStart(3, '0')
    return `PO-${year}${month}-${number}`
}

/**
 * Generate invoice number: INV-YYYYMM-XXX
 */
export const generateInvoiceNumber = async (getCount: () => Promise<number>): Promise<string> => {
    const date = dayjs()
    const year = date.format('YYYY')
    const month = date.format('MM')
    const count = await getCount()
    const number = String(count + 1).padStart(3, '0')
    return `INV-${year}${month}-${number}`
}

/**
 * Generate SKU: CAT-YYYYMMDD-XXXX
 */
export const generateSKU = (category: string): string => {
    const date = dayjs()
    const dateStr = date.format('YYYYMMDD')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const cat = category.substring(0, 3).toUpperCase()
    return `${cat}-${dateStr}-${random}`
}

/**
 * Generate a random ID
 */
export const generateId = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
