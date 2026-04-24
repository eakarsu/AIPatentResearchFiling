import React from 'react';
import ReactMarkdown from 'react-markdown';

export default function AIResultDisplay({ result }) {
  if (!result) return null;

  return (
    <div className="ai-result-container" style={{ marginTop: '20px' }}>
      <div className="ai-result-header">
        <span className="ai-result-badge">
          {result.success ? '✨ AI Analysis' : '⚠️ AI Error'}
        </span>
        {result.model && (
          <span className="ai-result-model">Model: {result.model}</span>
        )}
      </div>

      <div className="ai-result-content">
        {result.success ? (
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1>{children}</h1>,
              h2: ({ children }) => <h2>{children}</h2>,
              h3: ({ children }) => <h3>{children}</h3>,
              p: ({ children }) => <p>{children}</p>,
              ul: ({ children }) => <ul>{children}</ul>,
              ol: ({ children }) => <ol>{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => <strong>{children}</strong>,
              em: ({ children }) => <em>{children}</em>,
              code: ({ inline, children }) =>
                inline ? (
                  <code>{children}</code>
                ) : (
                  <pre style={{
                    background: 'rgba(0,0,0,0.3)',
                    padding: '16px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    marginBottom: '12px',
                  }}>
                    <code>{children}</code>
                  </pre>
                ),
              blockquote: ({ children }) => <blockquote>{children}</blockquote>,
              table: ({ children }) => (
                <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                  }}>
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  borderBottom: '2px solid var(--primary)',
                  color: 'var(--primary-light)',
                  fontWeight: 700,
                }}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  {children}
                </td>
              ),
            }}
          >
            {result.result}
          </ReactMarkdown>
        ) : (
          <div style={{
            padding: '16px',
            background: 'rgba(252,129,129,0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(252,129,129,0.2)',
            color: 'var(--danger)',
          }}>
            {result.result}
          </div>
        )}
      </div>

      {result.usage && (
        <div className="ai-result-usage">
          <span>Prompt tokens: {result.usage.prompt_tokens}</span>
          <span>Completion tokens: {result.usage.completion_tokens}</span>
          <span>Total tokens: {result.usage.total_tokens}</span>
        </div>
      )}
    </div>
  );
}
