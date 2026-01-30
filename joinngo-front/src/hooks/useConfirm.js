import { useState, useCallback } from 'react'

export const useConfirm = () => {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    showCancel: true,
    danger: false,
  })

  const showConfirm = useCallback(
    (title, message, onConfirm, danger = false, showCancel = true) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        onConfirm,
        danger,
        showCancel,
      })
    },
    [],
  )

  const hideConfirm = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }))
  }, [])

  return {
    confirmModal,
    showConfirm,
    hideConfirm,
  }
}
