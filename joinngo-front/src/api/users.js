import apiClient from './axiosClient'

export async function getAllUsers(page = 1, pageSize = 10) {
  const response = await apiClient.get('/User/all', {
    params: { page, pageSize },
  })
  return response.data
}

export const getPublicProfile = async (id) => {
  const response = await apiClient.get(`/User/${id}/public-profile`)
  return response.data
}

export const toggleFollow = async (id) => {
  const response = await apiClient.post(`/User/${id}/follow`, {})
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

export async function getMyFollowers() {
  const response = await apiClient.get('/User/my-followers')
  return response.data
}
