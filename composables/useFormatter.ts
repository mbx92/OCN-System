import { formatCurrency, formatDate, formatDateTime, formatNumber, formatPercentage, formatPhone, truncateText, formatRelativeTime } from '~/utils/format'

export const useFormatter = () => {
    return {
        formatCurrency,
        formatDate,
        formatDateTime,
        formatNumber,
        formatPercentage,
        formatPhone,
        truncateText,
        formatRelativeTime,
    }
}
