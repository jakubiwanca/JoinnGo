import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'

function ConfirmEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [backendStatus, setBackendStatus] = useState('')
  const [countdown, setCountdown] = useState(10)
  const dataFetchedRef = React.useRef(false)

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token')

      if (dataFetchedRef.current) return
      dataFetchedRef.current = true

      if (!token) {
        setStatus('error')
        setMessage('Nieprawidłowy link potwierdzający.')
        return
      }

      try {
        const response = await apiClient.get(`/User/confirm-email?token=${token}`)

        let msg = response.data
        let code = 'confirmed'

        if (typeof response.data === 'object' && response.data !== null) {
          msg = response.data.message
          code = response.data.status
        }

        setMessage(msg)
        setBackendStatus(code)

        setStatus('success')
      } catch (error) {
        setStatus('error')
        let errorMsg = error.response?.data
        if (typeof errorMsg === 'object' && errorMsg !== null) {
          errorMsg = errorMsg.message || JSON.stringify(errorMsg)
        }
        setMessage(errorMsg || 'Wystąpił błąd podczas potwierdzania email.')
      }
    }

    confirmEmail()
  }, [searchParams])

  useEffect(() => {
    let timer
    if (status === 'success' && backendStatus === 'confirmed' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (status === 'success' && backendStatus === 'confirmed' && countdown === 0) {
      navigate('/login')
    }
    return () => clearInterval(timer)
  }, [status, backendStatus, countdown, navigate])

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        {status === 'loading' && (
          <>
            <div className="spinner" style={{ margin: '0 auto 20px' }}></div>
            <h2>Potwierdzam email...</h2>
            <p style={{ color: '#6b7280' }}>Proszę czekać</p>
          </>
        )}

        {status === 'success' && (
          <>
            {backendStatus === 'confirmed' ? (
              <>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
                <h2 style={{ color: '#10b981', marginBottom: '15px' }}>Email potwierdzony!</h2>
                <p
                  style={{
                    color: '#6b7280',
                    fontSize: '15px',
                    fontWeight: '500',
                    marginBottom: '20px',
                  }}
                >
                  Za chwilę zostaniesz przekierowany na stronę logowania ({countdown}s)...
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>ℹ️</div>
                <h2 style={{ color: '#3b82f6', marginBottom: '15px' }}>Link nieaktywny</h2>
                <p
                  style={{
                    color: '#6b7280',
                    fontSize: '15px',
                    fontWeight: '500',
                    marginBottom: '20px',
                  }}
                >
                  {message}
                </p>
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn-primary"
                onClick={() => navigate('/login')}
                style={{ width: '100%' }}
              >
                {backendStatus === 'confirmed'
                  ? 'Przejdź do logowania teraz'
                  : 'Przejdź do logowania'}
              </button>
              {backendStatus !== 'confirmed' && (
                <button
                  className="btn-secondary"
                  onClick={() => navigate('/')}
                  style={{ width: '100%' }}
                >
                  Strona główna
                </button>
              )}
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
            <h2 style={{ color: '#ef4444', marginBottom: '15px' }}>Błąd potwierdzenia</h2>
            <div className="alert alert-error" style={{ marginBottom: '30px' }}>
              {message}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn-primary"
                onClick={() => navigate('/login')}
                style={{ width: '100%' }}
              >
                Przejdź do logowania
              </button>
              <button
                className="btn-secondary"
                onClick={() => navigate('/')}
                style={{ width: '100%' }}
              >
                Strona główna
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ConfirmEmailPage
