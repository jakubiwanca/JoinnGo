import React from 'react'

import ReactDOM from 'react-dom'

function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Tak',
  cancelText = 'Anuluj',
  danger = false,
  showCancel = true,
}) {
  if (!isOpen) return null

  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 2000 }}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-modal-title">{title}</h3>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          {showCancel && (
            <button className="btn-secondary" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm}>
            {showCancel ? confirmText : 'OK'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ConfirmModal
