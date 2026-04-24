import React from 'react';
import { getBadgeClass } from '../services/features';
import AIResultDisplay from './AIResultDisplay';

export default function DetailModal({ item, feature, onClose, onEdit, onDelete, onAIAnalyze, aiResult, aiLoading }) {
  const formatLabel = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatValue = (key, value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (key === 'status' || key === 'risk_level' || key === 'threat_level' || key === 'priority' || key === 'monitoring_status') {
      return <span className={`badge ${getBadgeClass(value)}`}>{String(value).replace(/_/g, ' ')}</span>;
    }
    if (key.includes('score')) {
      const num = parseFloat(value);
      const color = num >= 80 ? 'var(--success)' : num >= 50 ? 'var(--warning)' : 'var(--danger)';
      return <span style={{ color, fontWeight: 700, fontSize: '18px' }}>{value}</span>;
    }
    if (key.includes('date') && value) {
      return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    return String(value);
  };

  const isLongField = (key) => {
    return ['description', 'invention_description', 'invention_summary', 'analysis_result',
      'claim_mapping', 'claims_text', 'key_patents', 'notes', 'comments', 'original_text',
      'translated_text', 'technology_areas', 'white_spaces', 'trends', 'key_players',
      'influential_citations', 'abstract'].includes(key);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{feature.icon} Item Details</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="detail-grid">
            {feature.detailFields.map(key => (
              <div key={key} className={`detail-field ${isLongField(key) ? 'full' : ''}`}>
                <span className="detail-label">{formatLabel(key)}</span>
                <span className="detail-value">{formatValue(key, item[key])}</span>
              </div>
            ))}
          </div>

          {item.ai_summary && (
            <div className="ai-result-container">
              <div className="ai-result-header">
                <span className="ai-result-badge">AI Summary</span>
              </div>
              <div className="ai-result-content">
                <p>{item.ai_summary}</p>
              </div>
            </div>
          )}

          {aiResult && <AIResultDisplay result={aiResult} />}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-primary btn-sm"
            onClick={onAIAnalyze}
            disabled={aiLoading}
          >
            {aiLoading ? 'Analyzing...' : 'AI Analyze'}
          </button>
          <button className="btn btn-warning btn-sm" onClick={onEdit}>
            Edit
          </button>
          <button className="btn btn-danger btn-sm" onClick={onDelete}>
            Delete
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
