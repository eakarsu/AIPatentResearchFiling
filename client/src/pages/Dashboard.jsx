import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { features } from '../services/features';
import api from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const fetchCounts = async () => {
      const results = {};
      for (const f of features) {
        try {
          const res = await api.get(f.apiPath);
          results[f.key] = res.data.length;
        } catch {
          results[f.key] = 0;
        }
      }
      setCounts(results);
    };
    fetchCounts();
  }, []);

  const totalItems = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="animate-in">
      <div className="dashboard-header">
        <h1>AI Patent Research & Filing</h1>
        <p>Intelligent IP Management Platform - $6B IP Services Market</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-value">{totalItems}</div>
          <div className="stat-label">Total Records</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{features.length}</div>
          <div className="stat-label">Active Features</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">15+</div>
          <div className="stat-label">AI Models</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">$6B</div>
          <div className="stat-label">Market Size</div>
        </div>
      </div>

      <div className="feature-cards">
        {features.map((f) => (
          <div
            key={f.key}
            className="feature-card"
            onClick={() => navigate(`/feature/${f.key}`)}
          >
            <div
              className="feature-card-icon"
              style={{ background: `${f.color}20`, color: f.color }}
            >
              {f.icon}
            </div>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
            <div className="feature-card-count">
              {counts[f.key] !== undefined ? counts[f.key] : '...'} items
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
