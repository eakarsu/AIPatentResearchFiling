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
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(feature.apiPath);
      setItems(res.data);
    } catch (err) {
      console.error('Failed to fetch items:', err);
    } finally {
      setLoading(false);
    }
  }, [feature.apiPath]);

  useEffect(() => {
    if (feature) fetchItems();
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
    try {
      const res = await api.post(`${feature.apiPath}/ai-analyze`, {
        prompt: aiPrompt,
      });
      setAiResult(res.data);
    } catch (err) {
      setAiResult({ success: false, result: err.response?.data?.error || err.message });
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIAnalyzeItem = async (item) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.post(`${feature.apiPath}/${item.id}/ai-analyze`, {
        action: `Analyze this ${feature.title.toLowerCase()} item and provide detailed insights, recommendations, and next steps.`,
      });
      setAiResult(res.data);
    } catch (err) {
      setAiResult({ success: false, result: err.response?.data?.error || err.message });
    } finally {
      setAiLoading(false);
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
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} onClick={() => setSelectedItem(item)}>
                  <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                  {feature.columns.map(col => (
                    <td key={col.key}>{formatCellValue(col, item[col.key])}</td>
                  ))}
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
