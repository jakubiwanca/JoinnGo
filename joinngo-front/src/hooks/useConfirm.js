import { useState } from 'react'

export const useConfirm = () => {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    showCancel: true,
    danger: false,
  })

  const showConfirm = (title, message, onConfirm, danger = false, showCancel = true) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      danger,
      showCancel,
    })
  }

  const hideConfirm = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }))
  }

  return {
    confirmModal,
    showConfirm,
    hideConfirm,
  }
}
