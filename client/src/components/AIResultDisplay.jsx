import React from 'react';
import AIReport from './AIReport';

export default function AIResultDisplay({ result }) {
  if (!result) return null;
  if (result.success === false) return <div className="ai-alert" role="alert">{result.result || result.error || 'AI request failed'}</div>;
  return <AIReport response={result.raw || result} title="AI analysis" model={result.model} tokens={result.usage} />;
}
