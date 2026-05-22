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

          <div style={{ padding: '8px 16px 4px', fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Gap Features</div>

          {[
            { path: '/gap-claims-without-claim', icon: '📋', label: 'Claim Broadness' },
            { path: '/gap-landscape-without-market', icon: '🗺️', label: 'Market Threat Score' },
            { path: '/gap-filing-without-rejection', icon: '📁', label: 'Rejection Predict' },
            { path: '/gap-competitor-without-competitor', icon: '👁️', label: 'Innovation Track' },
            { path: '/gap-infringement-without-infringement', icon: '🛡️', label: 'Infringement Risk' },
            { path: '/gap-no-uspto-integration-automated-filing-status-track', icon: '🏛️', label: 'USPTO Integration' },
            { path: '/gap-no-foreign-patent-coordination-pct-filing-country', icon: '🌍', label: 'PCT Coordination' },
            { path: '/gap-no-integration-with-scientific-literature-database', icon: '🔬', label: 'Literature DB' },
            { path: '/gap-limited-inventor-management-no-inventor-contributi', icon: '👤', label: 'Inventor Mgmt' },
            { path: '/gap-no-licensing-marketplace', icon: '🏪', label: 'Licensing Market' },
            { path: '/gap-limited-frontend-only-4-pages-for-a-18', icon: '📱', label: 'Extended Pages' },
            { path: '/gap-no-webhooks-for-uspto-docket-updates', icon: '🔔', label: 'USPTO Webhooks' },
            { path: '/gap-no-notifications-layer-for-filing-deadlines', icon: '⏰', label: 'Deadline Alerts' },
          ].map(({ path, icon, label }) => (
            <button
              key={path}
              className={`sidebar-link ${location.pathname === path ? 'active' : ''}`}
              onClick={() => navigate(path)}
            >
              <span style={{ fontSize: '16px', width: '18px', textAlign: 'center' }}>{icon}</span>
              {label}
            </button>
          ))}
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
