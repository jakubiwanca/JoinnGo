import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const OnboardingModal = () => {
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname === '/profile') {
    return null
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '10px' }}>Uzupełnij swój profil 👤</h2>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>
          Aby w pełni korzystać z serwisu (tworzyć wydarzenia, dołączać do innych), musisz ustawić
          nazwę użytkownika.
        </p>

        <button
          className="btn-primary"
          style={{ width: '100%' }}
          onClick={() => navigate('/profile')}
        >
          Przejdź do profilu
        </button>
      </div>
    </div>
  )
}

export default OnboardingModal
