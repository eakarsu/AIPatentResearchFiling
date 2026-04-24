import React, { useState } from 'react';
import api from '../services/api';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAutoFill = () => {
    setEmail('admin@patentai.com');
    setPassword('password123');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      onLogin(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-in">
        <div className="login-logo">
          <h1>AI Patent Research & Filing</h1>
          <p>Intelligent IP Management Platform</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <button type="button" className="btn btn-auto-fill" onClick={handleAutoFill}>
            Auto-fill Demo Credentials
          </button>
        </form>
      </div>
    </div>
  );
}
