import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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
      setItems(d.data || []);
      setPage(d.page || 1);
      setTotalPages(d.totalPages || 1);
      setTotal(d.total || 0);
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

              {/* Structured JSON display if available */}
              {selected.result_json && (() => {
                let parsed;
                try { parsed = JSON.parse(selected.result_json); } catch { parsed = selected.result_json; }
                return (
                  <div style={{ marginBottom: '16px' }}>
                    {parsed?.novelty_score !== undefined && (
                      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <div style={{ background: 'rgba(34,197,94,0.1)', padding: '12px 20px', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>{parsed.novelty_score}</div>
                          <div style={{ fontSize: '11px', color: '#888' }}>Novelty Score</div>
                        </div>
                        {parsed.relevant_patents?.length > 0 && (
                          <div style={{ background: 'rgba(99,102,241,0.1)', padding: '12px 20px', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, color: '#6366f1' }}>{parsed.relevant_patents.length}</div>
                            <div style={{ fontSize: '11px', color: '#888' }}>Patents Found</div>
                          </div>
                        )}
                      </div>
                    )}
                    {parsed?.relevant_patents?.length > 0 && (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontWeight: 600, marginBottom: '8px' }}>Relevant Patents</div>
                        {parsed.relevant_patents.map((p, i) => (
                          <div key={i} style={{ background: 'var(--bg-input, #0d0d1a)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px 14px', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '12px' }}>{p.patent_number}</div>
                                <div style={{ fontWeight: 600 }}>{p.title}</div>
                                <div style={{ fontSize: '12px', color: '#ccc', marginTop: '4px' }}>{p.abstract}</div>
                              </div>
                              <div style={{ color: p.relevance_score >= 80 ? '#ef4444' : p.relevance_score >= 60 ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>
                                {p.relevance_score || p.similarity_score}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {parsed?.recommendations?.length > 0 && (
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '6px' }}>Recommendations</div>
                        <ul style={{ paddingLeft: '20px', color: '#ccc' }}>
                          {parsed.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Raw text result */}
              <details>
                <summary style={{ cursor: 'pointer', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Raw AI Response
                </summary>
                <pre style={{ fontSize: '12px', color: '#ccc', overflow: 'auto', maxHeight: '300px', background: 'var(--bg-input, #0d0d1a)', padding: '12px', borderRadius: '4px', marginTop: '8px' }}>
                  {selected.result}
                </pre>
              </details>
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
