const API_URL = 'http://localhost:5038/api/User'

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Request failed')
  }
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()
  return res.text()
}

export async function register(email, password) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return handleResponse(response)
}

export async function login(email, password) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return handleResponse(response)
}

export async function getProfile(token) {
  const response = await fetch(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return handleResponse(response)
}
