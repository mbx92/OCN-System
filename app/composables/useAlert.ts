interface AlertOptions {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

interface Alert extends AlertOptions {
  id: string
}

const alerts = ref<Alert[]>([])

export const useAlert = () => {
  const show = (
    messageOrOptions: string | AlertOptions,
    type?: 'success' | 'error' | 'warning' | 'info'
  ) => {
    const options: AlertOptions =
      typeof messageOrOptions === 'string'
        ? { type: type || 'info', message: messageOrOptions }
        : messageOrOptions
    const id = Math.random().toString(36).substring(7)
    const alert: Alert = {
      ...options,
      id,
      duration: options.duration ?? 5000,
    }

    alerts.value.push(alert)

    if (alert.duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, alert.duration)
    }

    return id
  }

  const dismiss = (id: string) => {
    const index = alerts.value.findIndex(a => a.id === id)
    if (index > -1) {
      alerts.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => {
    return show({ type: 'success', message, duration })
  }

  const error = (message: string, duration?: number) => {
    return show({ type: 'error', message, duration })
  }

  const warning = (message: string, duration?: number) => {
    return show({ type: 'warning', message, duration })
  }

  const info = (message: string, duration?: number) => {
    return show({ type: 'info', message, duration })
  }

  const clear = () => {
    alerts.value = []
  }

  return {
    alerts: readonly(alerts),
    show,
    showAlert: show,
    dismiss,
    success,
    error,
    warning,
    info,
    clear,
  }
}
