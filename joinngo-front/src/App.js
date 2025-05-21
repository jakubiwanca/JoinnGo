import React, { useState, useEffect } from "react";
import { register, login, getProfile } from "./api/auth";
import { jwtDecode } from "jwt-decode";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("jwtToken") || "");
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  // Dekoduj token i wyciągnij rolę:
  const decoded = token ? jwtDecode(token) : null;
  const role = decoded?.role || "User";

  useEffect(() => {
    if (token) {
      getProfile(token)
        .then(setProfile)
        .catch(() => {
          setError("Token nieważny lub wygasł");
          setToken("");
          localStorage.removeItem("jwtToken");
          setProfile(null);
        });
    }
  }, [token]);

  const handleRegister = async () => {
    setError("");
    try {
      const message = await register(email, password);
      alert(message);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogin = async () => {
    setError("");
    try {
      const data = await login(email, password);
      setToken(data.token);
      localStorage.setItem("jwtToken", data.token);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    setToken("");
    setProfile(null);
    localStorage.removeItem("jwtToken");
    setError("");
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      {!token ? (
        <>
          <h2>Zarejestruj się lub zaloguj</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <button onClick={handleRegister} style={{ marginRight: 10 }}>
            Zarejestruj
          </button>
          <button onClick={handleLogin}>Zaloguj</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      ) : (
        <>
          <h2>Witaj, {profile ? profile.email : "Ładowanie..."}</h2>
          {profile && (
            <pre
              style={{
                background: "#eee",
                padding: 10,
                borderRadius: 4,
                overflowX: "auto",
              }}
            >
              {JSON.stringify(profile, null, 2)}
            </pre>
          )}
          <button onClick={handleLogout}>Wyloguj</button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}
    </div>
  );
}

export default App;
