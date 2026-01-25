import apiClient from './axiosClient'

export async function login(email, password) {
  const response = await apiClient.post('/User/login', { email, password })
  return response.data
}

export async function register(email, password) {
  const response = await apiClient.post('/User/register', { email, password })
  return response.data
}

export async function getProfile() {
  const response = await apiClient.get('/User/profile')
  return response.data
}

export async function logout() {
  const response = await apiClient.post('/User/logout')
  return response.data
}

export async function changePassword(currentPassword, newPassword) {
  const response = await apiClient.post('/User/change-password', {
    currentPassword,
    newPassword,
  })
  return response.data
}

export async function updateProfile(data) {
  const response = await apiClient.put('/User/me', data)
  return response.data
}

export async function confirmEmail(token) {
  const response = await apiClient.get(`/User/confirm-email?token=${token}`)
  return response.data
}
