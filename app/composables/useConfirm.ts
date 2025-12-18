export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'default' | 'danger' | 'info' | 'success' | 'warning'
}

const state = reactive({
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Konfirmasi',
  cancelText: 'Batal',
  type: 'default' as ConfirmOptions['type'],
  resolve: null as ((value: boolean) => void) | null,
})

export const useConfirm = () => {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    state.title = options.title || 'Konfirmasi'
    state.message = options.message
    state.confirmText = options.confirmText || 'Ya, Lanjutkan'
    state.cancelText = options.cancelText || 'Batal'
    state.type = options.type || 'default'
    state.isOpen = true

    return new Promise(resolve => {
      state.resolve = resolve
    })
  }

  const handleConfirm = () => {
    state.isOpen = false
    if (state.resolve) {
      state.resolve(true)
      state.resolve = null
    }
  }

  const handleCancel = () => {
    state.isOpen = false
    if (state.resolve) {
      state.resolve(false)
      state.resolve = null
    }
  }

  return {
    state,
    confirm,
    handleConfirm,
    handleCancel,
  }
}
