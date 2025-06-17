export async function getAllUsers(token) {
  console.log("Wysyłany token:", token);

  const res = await fetch("http://localhost:5038/api/user/all", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  console.log("Odpowiedź z backendu:", res.status, text);

  if (!res.ok) {
    throw new Error("Nie udało się pobrać listy użytkowników");
  }

  return JSON.parse(text);
}

export async function deleteUser(id, token) {
  const res = await fetch(`http://localhost:5038/api/user/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Nie udało się usunąć użytkownika");
  }

  return res.text();
}

