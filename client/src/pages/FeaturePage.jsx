import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFeature, getBadgeClass } from '../services/features';
import api from '../services/api';
import DetailModal from '../components/DetailModal';
import FormModal from '../components/FormModal';
import AIResultDisplay from '../components/AIResultDisplay';

export default function FeaturePage() {
  const { featureKey } = useParams();
  const navigate = useNavigate();
  const feature = getFeature(featureKey);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [priorArtResults, setPriorArtResults] = useState(null);

  const fetchItems = useCallback(async (p = 1) => {
    try {
      setLoading(true);
      const res = await api.get(feature.apiPath, { params: { page: p, limit: 20 } });
      const d = res.data;
      if (d.data && d.totalPages !== undefined) {
        setItems(d.data);
        setPage(d.page);
        setTotalPages(d.totalPages);
        setTotal(d.total);
      } else {
        setItems(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  }, [feature?.apiPath]);

  useEffect(() => {
    if (feature) fetchItems(1);
  }, [feature, fetchItems]);

  if (!feature) {
    navigate('/');
    return null;
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`${feature.apiPath}/${id}`);
      setItems(items.filter(i => i.id !== id));
      setSelectedItem(null);
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSave = async (data) => {
    try {
      if (editItem) {
        const res = await api.put(`${feature.apiPath}/${editItem.id}`, data);
        setItems(items.map(i => i.id === editItem.id ? res.data : i));
      } else {
        const res = await api.post(feature.apiPath, data);
        setItems([res.data, ...items]);
      }
      setShowForm(false);
      setEditItem(null);
    } catch (err) {
      alert('Failed to save: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setShowForm(true);
    setSelectedItem(null);
  };

  const handleAIAnalyze = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    setPriorArtResults(null);
    try {
      const res = await api.post(`${feature.apiPath}/ai-analyze`, {
        prompt: aiPrompt,
      });
      setAiResult(res.data);
      // If prior-art or patent-search, try to show structured results
      if (res.data.parsed?.relevant_patents) {
        setPriorArtResults(res.data.parsed);
      }
    } catch (err) {
      setAiResult({ success: false, result: err.response?.data?.error || err.message });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIAnalyzeItem = async (item) => {
    setAiLoading(true);
    setAiResult(null);
    setPriorArtResults(null);
    try {
      const res = await api.post(`${feature.apiPath}/${item.id}/ai-analyze`, {
        action: `Analyze this ${feature.title.toLowerCase()} item and provide detailed insights, recommendations, and next steps.`,
      });
      setAiResult(res.data);
      if (res.data.parsed?.relevant_patents) {
        setPriorArtResults(res.data.parsed);
      }
    } catch (err) {
      setAiResult({ success: false, result: err.response?.data?.error || err.message });
    } finally {
      setAiLoading(false);
    }
  };

  const handleExportPDF = async (item) => {
    try {
      const res = await api.get(`/ai/patents/${item.id}/export-pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `patent-${item.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('PDF export failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const formatCellValue = (col, value) => {
    if (value === null || value === undefined) return '-';
    if (col.type === 'badge') {
      return <span className={`badge ${getBadgeClass(value)}`}>{String(value).replace(/_/g, ' ')}</span>;
    }
    if (col.type === 'score') {
      const num = parseFloat(value);
      const color = num >= 80 ? 'var(--success)' : num >= 50 ? 'var(--warning)' : 'var(--danger)';
      return <span style={{ color, fontWeight: 600 }}>{value}</span>;
    }
    return String(value);
  };

  const isPriorArtOrSearch = ['prior-art', 'patent-search'].includes(featureKey);

  return (
    <div className="animate-in">
      <div className="page-header">
        <div className="page-header-left">
          <button className="back-btn" onClick={() => navigate('/')}>
            ←
          </button>
          <div>
            <h1>{feature.icon} {feature.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
              {feature.description}
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>
          + New Item
        </button>
      </div>

      {/* AI Analysis Section */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{
            background: 'var(--gradient-1)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '700',
            color: 'white',
          }}>
            AI POWERED
          </span>
          <span style={{ fontSize: '14px', fontWeight: '600' }}>{feature.aiPromptLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder={`Enter your ${feature.title.toLowerCase()} query for AI analysis...`}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontFamily: 'inherit',
              minHeight: '60px',
              resize: 'vertical',
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handleAIAnalyze}
            disabled={aiLoading || !aiPrompt.trim()}
            style={{ alignSelf: 'flex-end', minWidth: '140px' }}
          >
            {aiLoading ? (
              <><span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Analyzing...</>
            ) : (
              'AI Analyze'
            )}
          </button>
        </div>

        {aiResult && <AIResultDisplay result={aiResult} />}

        {/* Structured Prior Art / Patent Search Results */}
        {priorArtResults && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(34,197,94,0.1)', padding: '12px 20px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>{priorArtResults.novelty_score}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Novelty Score</div>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.1)', padding: '12px 20px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#6366f1' }}>{priorArtResults.relevant_patents?.length || 0}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Patents Found</div>
              </div>
            </div>

            {priorArtResults.relevant_patents?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>Relevant Prior Art Patents</div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {priorArtResults.relevant_patents.map((p, i) => (
                    <div key={i} style={{
                      background: 'var(--bg-input, #0d0d1a)',
                      border: '1px solid var(--border, #333)',
                      borderRadius: '8px',
                      padding: '14px 16px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#a5b4fc', fontSize: '13px', marginBottom: '2px' }}>{p.patent_number}</div>
                          <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{p.title}</div>
                          {p.assignee && <div style={{ fontSize: '12px', color: '#888' }}>Assignee: {p.assignee}</div>}
                          {p.filing_date && <div style={{ fontSize: '12px', color: '#888' }}>Filed: {p.filing_date}</div>}
                          <div style={{ fontSize: '12px', color: '#ccc', marginTop: '6px' }}>{p.abstract}</div>
                        </div>
                        <div style={{ textAlign: 'center', minWidth: '60px' }}>
                          <div style={{
                            fontSize: '18px', fontWeight: 700,
                            color: p.relevance_score >= 80 ? '#ef4444' : p.relevance_score >= 60 ? '#f59e0b' : '#22c55e'
                          }}>
                            {p.relevance_score || p.similarity_score}%
                          </div>
                          <div style={{ fontSize: '10px', color: '#888' }}>Relevance</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {priorArtResults.recommendations?.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: '8px', fontSize: '14px' }}>Recommendations</div>
                <ul style={{ paddingLeft: '20px', color: '#ccc' }}>
                  {priorArtResults.recommendations.map((r, i) => <li key={i} style={{ marginBottom: '4px' }}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="loading-spinner">
          <div className="spinner" />
          <span>Loading {feature.title}...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
          <h3>No {feature.title} items yet</h3>
          <p style={{ marginBottom: '20px' }}>Click "New Item" to create your first entry.</p>
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowForm(true); }}>
            + Create First Item
          </button>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                {feature.columns.map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} onClick={() => setSelectedItem(item)}>
                  <td style={{ color: 'var(--text-muted)' }}>{(page - 1) * 20 + idx + 1}</td>
                  {feature.columns.map(col => (
                    <td key={col.key}>{formatCellValue(col, item[col.key])}</td>
                  ))}
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleExportPDF(item)}
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                      title="Export PDF"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', marginTop: '16px', padding: '8px' }}>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => fetchItems(page - 1)}
                disabled={page <= 1}
              >
                Prev
              </button>
              <span style={{ padding: '0 16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                Page {page} of {totalPages} ({total} total)
              </span>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => fetchItems(page + 1)}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <DetailModal
          item={selectedItem}
          feature={feature}
          onClose={() => setSelectedItem(null)}
          onEdit={() => handleEdit(selectedItem)}
          onDelete={() => handleDelete(selectedItem.id)}
          onAIAnalyze={() => handleAIAnalyzeItem(selectedItem)}
          aiResult={aiResult}
          aiLoading={aiLoading}
        />
      )}

      {/* Create/Edit Form Modal */}
      {showForm && (
        <FormModal
          feature={feature}
          editItem={editItem}
          onClose={() => { setShowForm(false); setEditItem(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
