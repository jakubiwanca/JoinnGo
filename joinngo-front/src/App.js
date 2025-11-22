import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

import Home from './pages/Home';
import LoginPage from './pages/LoginPage'; // <-- Nowy import
import AdminPanel from './pages/AdminPanel';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || '');
  
  let role = 'User';
  if (token) {
    try {
        const decoded = jwtDecode(token);
        role = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User';
    } catch (e) {
        localStorage.removeItem('jwtToken');
        setToken('');
    }
  }

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('jwtToken');
  };

  const HomeWrapper = () => {
    const navigate = useNavigate();
    return <Home token={token} role={role} onLogout={handleLogout} navigate={navigate} />;
  };

  return (
    <Router>
      <Routes>
        <Route 
            path="/" 
            element={token ? <HomeWrapper /> : <LoginPage setToken={setToken} />} 
        />
        
        <Route
          path="/admin"
          element={
            role === 'Admin' && token ? (
              <AdminPanel token={token} onLogout={handleLogout} />
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