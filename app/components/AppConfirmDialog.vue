<template>
  <dialog :class="{ 'modal-open': state.isOpen }" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg" :class="getTitleClass()">{{ state.title }}</h3>
      <p class="py-4 whitespace-pre-line">{{ state.message }}</p>
      <div class="modal-action">
        <button class="btn" @click="handleCancel">{{ state.cancelText }}</button>
        <button class="btn" :class="getConfirmButtonClass()" @click="handleConfirm">
          {{ state.confirmText }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button @click="handleCancel">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
const { state, handleConfirm, handleCancel } = useConfirm()

const getConfirmButtonClass = () => {
  const map: Record<string, string> = {
    danger: 'btn-error text-white',
    info: 'btn-info text-white',
    success: 'btn-success text-white',
    warning: 'btn-warning text-black',
    default: 'btn-primary',
  }
  return map[state.type || 'default'] || 'btn-primary'
}

const getTitleClass = () => {
  const map: Record<string, string> = {
    danger: 'text-error',
    info: 'text-info',
    success: 'text-success',
    warning: 'text-warning',
    default: '',
  }
  return map[state.type || 'default'] || ''
}
</script>
