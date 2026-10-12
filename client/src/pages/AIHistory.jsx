import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import AIReport from '../components/AIReport';

export default function AIHistory() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/ai/history', { params: { page: p, limit: 20 } });
      const d = res.data;
      const rows = Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
      setItems(rows);
      setPage(Number(d?.page ?? d?.pagination?.page) || 1);
      setTotalPages(Number(d?.totalPages ?? d?.pagination?.totalPages) || 1);
      setTotal(Number(d?.total ?? d?.pagination?.total) || rows.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const formatEndpoint = (ep) => ep?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '-';

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <button className="back-btn" onClick={() => navigate('/')}>←</button>
          <div>
            <h1>AI History</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              Past AI analyses and predictions — {total} total records
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span>Loading AI history...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
          <h3>No AI history yet</h3>
          <p>Run AI analyses on any feature to see results here.</p>
        </div>
      ) : (
        <>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Endpoint</th>
                  <th>Patent ID</th>
                  <th>Model</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 20 + idx + 1}</td>
                    <td>
                      <span className="badge badge-info" style={{ fontSize: '11px' }}>
                        {formatEndpoint(item.endpoint)}
                      </span>
                    </td>
                    <td>{item.patent_id || '-'}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {item.model ? item.model.split('/').pop() : '-'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setSelected(selected?.id === item.id ? null : item)}
                        style={{ fontSize: '11px', padding: '3px 10px' }}
                      >
                        {selected?.id === item.id ? 'Hide' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div style={{
              marginTop: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '24px',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '15px' }}>
                {formatEndpoint(selected.endpoint)}
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '12px' }}>
                  {new Date(selected.created_at).toLocaleString()}
                </span>
              </div>

              <AIReport response={selected.result_json ?? selected.result} title={`${formatEndpoint(selected.endpoint)} analysis`} model={selected.model} />
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', marginTop: '16px' }}>
              <button className="btn btn-sm btn-secondary" onClick={() => load(page - 1)} disabled={page <= 1}>Prev</button>
              <span style={{ padding: '0 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Page {page} of {totalPages}
              </span>
              <button className="btn btn-sm btn-secondary" onClick={() => load(page + 1)} disabled={page >= totalPages}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
