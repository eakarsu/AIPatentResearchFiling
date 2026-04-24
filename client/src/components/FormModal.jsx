import React, { useState } from 'react';

export default function FormModal({ feature, editItem, onClose, onSave }) {
  const [formData, setFormData] = useState(() => {
    if (editItem) {
      const data = {};
      feature.fields.forEach(f => {
        data[f.key] = editItem[f.key] || '';
      });
      return data;
    }
    const data = {};
    feature.fields.forEach(f => {
      data[f.key] = f.type === 'number' ? '' : '';
    });
    return data;
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const cleanData = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value !== '' && value !== null && value !== undefined) {
        cleanData[key] = value;
      }
    }
    await onSave(cleanData);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-in" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editItem ? 'Edit' : 'New'} {feature.title} Item</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="detail-grid">
              {feature.fields.map(field => (
                <div key={field.key} className={`form-group ${field.type === 'textarea' ? 'full' : ''}`}
                  style={field.type === 'textarea' ? { gridColumn: '1 / -1' } : {}}
                >
                  <label>
                    {field.label}
                    {field.required && <span style={{ color: 'var(--danger)' }}> *</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      required={field.required}
                    >
                      <option value="">Select {field.label}</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editItem ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
