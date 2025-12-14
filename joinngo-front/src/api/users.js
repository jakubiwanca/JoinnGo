import apiClient from './axiosClient';

const ENDPOINT = '/User';

export const getAllUsers = async (token) => {
  const config = {
      headers: { Authorization: `Bearer ${token}` }
  };
  
  const response = await apiClient.get(`${ENDPOINT}/all`, config);
  return response.data;
};

export const deleteUser = async (id, token) => {
  const config = {
      headers: { Authorization: `Bearer ${token}` }
  };

  const response = await apiClient.delete(`${ENDPOINT}/${id}`, config);
  return response.data;
};