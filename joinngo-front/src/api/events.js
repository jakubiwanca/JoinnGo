import apiClient from './axiosClient'

export const getEvents = async (params) => {
  const response = await apiClient.get('/Event', { params })
  return response.data
}

export const getEvent = async (id) => {
  const response = await apiClient.get(`/Event/${id}`)
  return response.data
}

export const createEvent = async (data) => {
  const response = await apiClient.post('/Event', data)
  return response.data
}

export const updateEvent = async (id, data) => {
  const response = await apiClient.put(`/Event/${id}`, data)
  return response.data
}

export const deleteEvent = async (id, deleteSeries = false) => {
  const response = await apiClient.delete(`/Event/${id}`, {
    params: { deleteSeries },
  })
  return response.data
}

export const joinEvent = async (id) => {
  const response = await apiClient.post(`/Event/${id}/join`)
  return response.data
}

export const leaveEvent = async (id) => {
  const response = await apiClient.delete(`/Event/${id}/leave`)
  return response.data
}

export const getMyCreatedEvents = async () => {
  const response = await apiClient.get('/Event/my-created')
  return response.data
}

export const getMyJoinedEvents = async () => {
  const response = await apiClient.get('/Event/my-joined')
  return response.data
}

export const getEventComments = async (id) => {
  const response = await apiClient.get(`event/${id}/comments`)
  return response.data
}

export const addComment = async (eventId, content) => {
  const response = await apiClient.post(`event/${eventId}/comments`, { content })
  return response.data
}

export const updateComment = async (commentId, content) => {
  const response = await apiClient.put(`event/comments/${commentId}`, { content })
  return response.data
}

export const deleteComment = async (commentId) => {
  const response = await apiClient.delete(`event/comments/${commentId}`)
  return response.data
}

export const getParticipants = async (eventId) => {
  const response = await apiClient.get(`event/${eventId}/participants`)
  return response.data
}

export const updateParticipantStatus = async (eventId, userId, status) => {
  const response = await apiClient.put(`event/${eventId}/participants/${userId}/status`, status, {
    headers: { 'Content-Type': 'application/json' },
  })
  return response.data
}

export const removeParticipant = async (eventId, userId) => {
  const response = await apiClient.delete(`event/${eventId}/participants/${userId}`)
  return response.data
}

export const getAdminAllEvents = async (page = 1, pageSize = 10) => {
  const response = await apiClient.get('/Event/admin/all', {
    params: { page, pageSize },
  })
  return response.data
}

export const getEventsByUser = async (userId) => {
  const response = await apiClient.get(`/Event/user/${userId}`)
  return response.data
}
