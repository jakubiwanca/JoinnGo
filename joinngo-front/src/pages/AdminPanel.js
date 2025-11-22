import React, { useEffect, useState } from "react";
import { getAllUsers, deleteUser } from "../api/users";
import { Link } from "react-router-dom";

function AdminPanel({ token, currentUserId, onLogout }) {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
      getAllUsers(token)
        .then(setUsers)
        .catch((err) => {
          console.error("getAllUsers error:", err);
          setError(err.message || "Błąd podczas ładowania użytkowników");
        });
    }
  }, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm("Czy na pewno chcesz usunąć tego użytkownika?")) return;

    try {
      await deleteUser(id, token);
      setUsers(users.filter((u) => String(u.id) !== String(id)));
    } catch (err) {
      console.error("deleteUser error:", err);
      setError(err.message || "Nie udało się usunąć użytkownika");
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h3>Panel administratora</h3>
        <div className="header-buttons">
          <Link to="/" className="header-btn">
            Powrót do strony głównej
          </Link>
          <button onClick={onLogout} className="logout-btn">
            Wyloguj się
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {users.length === 0 ? (
        <p>Brak użytkowników lub ładowanie...</p>
      ) : (
        <ul>
          {users.map((u) => (
            <li key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 6 }}>
              <div>
                <strong>{u.email}</strong> ({u.role})
              </div>
              <div>
                {String(u.id) !== String(currentUserId) && (
                  <button onClick={() => handleDelete(u.id)} className="delete-btn">
                    Usuń
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminPanel;
