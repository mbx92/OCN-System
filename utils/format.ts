import dayjs from 'dayjs'
import 'dayjs/locale/id'

dayjs.locale('id')

/**
 * Format currency to IDR (Indonesian Rupiah)
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return 'Rp 0'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return 'Rp 0'

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num)
}

/**
 * Format date to Indonesian format
 */
export const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-'
    return dayjs(date).format('DD MMM YYYY')
}

/**
 * Format datetime to Indonesian format
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return '-'
    return dayjs(date).format('DD MMM YYYY HH:mm')
}

/**
 * Format relative time (e.g., "2 hari yang lalu")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
    if (!date) return '-'
    return dayjs(date).fromNow()
}

/**
 * Format number with thousand separator
 */
export const formatNumber = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return '0'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0'

    return new Intl.NumberFormat('id-ID').format(num)
}

/**
 * Format percentage
 */
export const formatPercentage = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return '0%'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '0%'

    return `${num.toFixed(1)}%`
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
}

/**
 * Format phone number
 */
export const formatPhone = (phone: string | null | undefined): string => {
    if (!phone) return '-'
    // Simple format for Indonesian phone numbers
    return phone.replace(/(\d{4})(\d{4})(\d+)/, '$1-$2-$3')
}
