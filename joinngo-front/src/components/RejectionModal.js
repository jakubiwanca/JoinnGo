import React from 'react'

const RejectionModal = ({ rejectedEvents, onConfirm, onClose }) => {
  if (!rejectedEvents || rejectedEvents.length === 0) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h3 style={{ color: '#ef4444', marginBottom: '15px' }}>Odrzucono prośby</h3>
        <p style={{ marginBottom: '20px' }}>
          Twoje prośby o dołączenie do następujących wydarzeń zostały odrzucone:
        </p>
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '20px', textAlign: 'left' }}>
          {rejectedEvents.map((e) => (
            <li
              key={e.id}
              style={{ padding: '8px 0', borderBottom: '1px solid #eee', fontWeight: 'bold' }}
            >
              {e.title}
            </li>
          ))}
        </ul>
        <button className="btn-primary" onClick={onConfirm} style={{ width: '100%' }}>
          Zrozumiałem
        </button>
      </div>
    </div>
  )
}

export default RejectionModal
