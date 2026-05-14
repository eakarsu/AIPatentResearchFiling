import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { features } from '../services/features';

export default function Layout({ user, onLogout, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="app-layout">
      <nav className="sidebar">
        <div className="sidebar-logo">
          <h2>AI Patent Research</h2>
          <span>IP Management Platform</span>
        </div>

        <div className="sidebar-nav">
          <button
            className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Dashboard
          </button>

          {features.map((f) => (
            <button
              key={f.key}
              className={`sidebar-link ${location.pathname === `/feature/${f.key}` ? 'active' : ''}`}
              onClick={() => navigate(`/feature/${f.key}`)}
            >
              <span style={{ fontSize: '16px', width: '18px', textAlign: 'center' }}>{f.icon}</span>
              {f.title}
            </button>
          ))}

          <button
            className={`sidebar-link ${location.pathname === '/ai-history' ? 'active' : ''}`}
            onClick={() => navigate('/ai-history')}
          >
            <span style={{ fontSize: '16px', width: '18px', textAlign: 'center' }}>🤖</span>
            AI History
          </button>

          <button
            className={`sidebar-link ${location.pathname === '/ai-predictive' ? 'active' : ''}`}
            onClick={() => navigate('/ai-predictive')}
          >
            <span style={{ fontSize: '16px', width: '18px', textAlign: 'center' }}>🔮</span>
            AI Predictive
          </button>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-email">{user.email}</div>
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={onLogout}
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
