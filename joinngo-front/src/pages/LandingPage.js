import React from 'react'
import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate('/register')
  }

  const handleLogin = () => {
    navigate('/login')
  }

  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="landing-logo">
          <span className="logo-icon">🎉</span>
          <h1 className="landing-title">Join'nGo</h1>
        </div>

        <p className="landing-subtitle">
          Odkrywaj wydarzenia, łącz się z ludźmi, twórz niezapomniane wspomnienia
        </p>

        <p className="landing-description">
          Platforma do zarządzania i odkrywania wydarzeń. Dołącz do społeczności, organizuj eventy i
          bierz udział w ekscytujących przygodach w Twojej okolicy.
        </p>

        <div className="landing-features">
          <div className="feature-item">
            <span className="feature-icon">🔍</span>
            <h3>Odkrywaj wydarzenia</h3>
            <p>Znajdź ciekawe eventy w swojej okolicy</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">👥</span>
            <h3>Poznawaj ludzi</h3>
            <p>Nawiązuj nowe znajomości i buduj relacje</p>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✨</span>
            <h3>Twórz wspomnienia</h3>
            <p>Organizuj własne wydarzenia dla innych</p>
          </div>
        </div>

        <button className="landing-cta" onClick={handleGetStarted}>
          Rozpocznij przygodę
          <span className="cta-arrow">→</span>
        </button>

        <p className="landing-login-hint">
          Masz już konto?{' '}
          <span className="landing-login-link" onClick={handleLogin}>
            Zaloguj się
          </span>
        </p>
      </div>
    </div>
  )
}

export default LandingPage
