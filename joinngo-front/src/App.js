import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import Home from "./pages/Home";
import AdminPanel from "./pages/AdminPanel";

import { getProfile } from "./api/auth";
import "./App.css";

function App() {
  const [token, setToken] = useState(localStorage.getItem("jwtToken") || "");
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

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

  const handleLogout = () => {
    setToken("");
    setProfile(null);
    localStorage.removeItem("jwtToken");
    setError("");
  };

  const HomeWrapper = (props) => {
    const navigate = useNavigate();

    return <Home {...props} navigate={navigate} />;
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <HomeWrapper
              token={token}
              setToken={setToken}
              profile={profile}
              role={role}
              setProfile={setProfile}
              error={error}
              setError={setError}
              onLogout={handleLogout}
            />
          }
        />
        <Route
          path="/admin"
          element={
            role === "Admin" && token ? (
              <AdminPanel
                token={token}
                currentUserId={profile?.id}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
