import apiClient from './axiosClient';

export async function getAllUsers() {
  const response = await apiClient.get('/User/all');
  return response.data;
}

export async function deleteUser(id) {
  const response = await apiClient.delete(`/User/${id}`);
  return response.data;
}