import React, { useState } from 'react';
import { register, login } from '../api/auth';
import { useNavigate } from 'react-router-dom';

function LoginPage({ setToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async () => {
    setError('');
    try {
      const message = await register(email, password);
      alert(message);
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  const handleLogin = async () => {
    setError('');
    try {
      const data = await login(email, password);
      localStorage.setItem('jwtToken', data.token);
      setToken(data.token);
      
      navigate('/');
    } catch (err) {
      setError(err.message || String(err));
    }
  };

  return (
    <div className="container">
      <h2>Zaloguj się lub zarejestruj</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input"
      />
      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input"
      />
      <button onClick={handleLogin} className="btn">Zaloguj</button>
      <button onClick={handleRegister} className="btn">Zarejestruj</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default LoginPage;