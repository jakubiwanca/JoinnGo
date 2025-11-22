const USERS_URL = 'http://localhost:5038/api/User'

export async function getAllUsers(token) {
  const res = await fetch(`${USERS_URL}/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('getAllUsers failed', res.status, text)
    throw new Error(text || 'Nie udało się pobrać listy użytkowników')
  }
  return res.json()
}

export async function deleteUser(id, token) {
  const res = await fetch(`${USERS_URL}/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Nie udało się usunąć użytkownika')
  }
  return res.text()
}
