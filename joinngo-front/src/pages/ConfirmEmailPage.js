import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import apiClient from '../api/axiosClient'

function ConfirmEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
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
        setStatus('success')
        setMessage(response.data)
      } catch (error) {
        setStatus('error')
        setMessage(error.response?.data || 'Wystąpił błąd podczas potwierdzania email.')
      }
    }

    confirmEmail()
  }, [searchParams])

  useEffect(() => {
    let timer
    if (status === 'success' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (status === 'success' && countdown === 0) {
      navigate('/login')
    }
    return () => clearInterval(timer)
  }, [status, countdown, navigate])

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
            <button
              className="btn-primary"
              onClick={() => navigate('/login')}
              style={{ width: '100%' }}
            >
              Przejdź do logowania teraz
            </button>
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
                onClick={() => navigate('/home')}
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
