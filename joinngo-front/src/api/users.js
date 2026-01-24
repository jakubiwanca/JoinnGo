import apiClient from './axiosClient'

export async function getAllUsers() {
  const response = await apiClient.get('/User/all')
  return response.data
}

export async function deleteUser(id) {
  const response = await apiClient.delete(`/User/${id}`)
  return response.data
}

export async function updateUser(id, data) {
  const response = await apiClient.put(`/User/${id}`, data)
  return response.data
}
