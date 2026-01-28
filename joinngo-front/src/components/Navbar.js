import React from 'react'
import { useNavigate } from 'react-router-dom'

function Navbar({ user, onLogout, onOpenCreateModal }) {
  const navigate = useNavigate()

  return (
    <header className="app-header">
      <div
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
        onClick={() => navigate('/home')}
      >
        <img
          src="/logo.png"
          alt="Join'nGo Logo"
          style={{
            height: '45px',
            width: '45px',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
        <div>
          <h2 style={{ margin: 0 }}>Join'nGo</h2>
          {user?.username && (
            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
              Zalogowany jako: <b>{user.username}</b>
            </span>
          )}
        </div>
      </div>
      <div className="header-actions">
        <button
          className="btn-primary"
          onClick={onOpenCreateModal}
          disabled={!user?.username}
          style={!user?.username ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          title={!user?.username ? 'Uzupełnij profil, aby utworzyć wydarzenie' : ''}
        >
          + Nowe Wydarzenie
        </button>
        <button className="btn-secondary" onClick={() => navigate('/profile')}>
          👤 Mój Profil
        </button>
        {user?.role === 'Admin' && (
          <button className="btn-secondary" onClick={() => navigate('/admin')}>
            Panel Admina
          </button>
        )}
        <button className="logout-btn" onClick={onLogout}>
          Wyloguj
        </button>
      </div>
    </header>
  )
}

export default Navbar
