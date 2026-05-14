import React, { useState } from 'react';
import api from '../services/api';
import AIResultDisplay from '../components/AIResultDisplay';

const TOOLS = [
  { id: 'claim-broadness', label: 'Claim Broadness Score', endpoint: '/ai/claim-broadness-score' },
  { id: 'rejection-predict', label: 'Rejection Predict', endpoint: '/ai/rejection-predict' },
  { id: 'infringement-risk', label: 'Infringement Risk Score', endpoint: '/ai/infringement-risk-score' },
  { id: 'market-threat', label: 'Market Threat Score', endpoint: '/ai/market-threat-score' },
  { id: 'competitor-track', label: 'Competitor Innovation Track', endpoint: '/ai/competitor-innovation-track' },
  { id: 'uspto-status', label: 'USPTO Status (creds)', endpoint: '/ai/uspto-status' },
  { id: 'pct-coordinator', label: 'PCT Coordinator', endpoint: '/ai/pct-coordinator' },
  { id: 'literature-search', label: 'Literature Search (creds)', endpoint: '/ai/literature-search' },
  { id: 'inventor-tracking', label: 'Inventor Tracking', endpoint: '/ai/inventor-tracking' },
  { id: 'licensing', label: 'Licensing Recommendation', endpoint: '/ai/licensing-recommendation' },
];

export default function AIPredictive() {
  const [activeTool, setActiveTool] = useState('claim-broadness');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [claim, setClaim] = useState({
    claim_text: '',
    field_of_art: '',
    prior_art_summary: '',
  });
  const [rejection, setRejection] = useState({
    application_text: '',
    examiner_history: '',
    art_unit: '',
    similar_filings: '',
  });
  const [infringe, setInfringe] = useState({
    own_patent: '',
    suspected_product: '',
    market_summary: '',
  });
  const [marketThreat, setMarketThreat] = useState({
    technology_domain: '',
    market_segment: '',
    our_position: '',
    competitor_signals: '',
  });
  const [competitorTrack, setCompetitorTrack] = useState({
    competitor_name: '',
    technology_focus: '',
    time_window_months: 12,
    recent_filings: '',
    recent_products: '',
  });
  const [uspto, setUspto] = useState({ application_number: '', patent_number: '' });
  const [pct, setPct] = useState({
    priority_date: '',
    technology_field: '',
    target_markets: '',
    budget_usd: '',
    commercial_priority: '',
  });
  const [lit, setLit] = useState({ query: '', max_results: 10 });
  const [inventor, setInventor] = useState({
    inventor_name: '',
    organization: '',
    time_range_years: 10,
    known_filings: '',
    known_assignments: '',
  });
  const [licensing, setLicensing] = useState({
    technology_summary: '',
    target_industries: '',
    exclusive: false,
    geography: 'global',
    comparable_deals: '',
  });

  const run = async () => {
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const tool = TOOLS.find(t => t.id === activeTool);
      let body;
      if (activeTool === 'claim-broadness') body = { ...claim };
      else if (activeTool === 'rejection-predict') body = { ...rejection };
      else if (activeTool === 'infringement-risk') body = { ...infringe };
      else if (activeTool === 'market-threat') {
        body = {
          technology_domain: marketThreat.technology_domain,
          market_segment: marketThreat.market_segment,
          our_position: marketThreat.our_position,
          competitor_signals: marketThreat.competitor_signals
            ? marketThreat.competitor_signals.split('\n').map(s => s.trim()).filter(Boolean)
            : [],
        };
      } else if (activeTool === 'competitor-track') {
        body = {
          competitor_name: competitorTrack.competitor_name,
          technology_focus: competitorTrack.technology_focus,
          time_window_months: parseInt(competitorTrack.time_window_months, 10) || 12,
          recent_filings: competitorTrack.recent_filings
            ? competitorTrack.recent_filings.split('\n').map(s => s.trim()).filter(Boolean)
            : [],
          recent_products: competitorTrack.recent_products
            ? competitorTrack.recent_products.split('\n').map(s => s.trim()).filter(Boolean)
            : [],
        };
      } else if (activeTool === 'uspto-status') {
        body = { ...uspto };
      } else if (activeTool === 'pct-coordinator') {
        body = {
          priority_date: pct.priority_date,
          technology_field: pct.technology_field,
          target_markets: pct.target_markets ? pct.target_markets.split(',').map(s => s.trim()).filter(Boolean) : [],
          budget_usd: pct.budget_usd ? Number(pct.budget_usd) : null,
          commercial_priority: pct.commercial_priority,
        };
      } else if (activeTool === 'literature-search') {
        body = { query: lit.query, max_results: Number(lit.max_results) || 10 };
      } else if (activeTool === 'inventor-tracking') {
        body = {
          inventor_name: inventor.inventor_name,
          organization: inventor.organization,
          time_range_years: parseInt(inventor.time_range_years, 10) || 10,
          known_filings: inventor.known_filings ? inventor.known_filings.split('\n').map(s => s.trim()).filter(Boolean) : [],
          known_assignments: inventor.known_assignments ? inventor.known_assignments.split('\n').map(s => s.trim()).filter(Boolean) : [],
        };
      } else if (activeTool === 'licensing') {
        body = {
          technology_summary: licensing.technology_summary,
          target_industries: licensing.target_industries ? licensing.target_industries.split(',').map(s => s.trim()).filter(Boolean) : [],
          exclusive: !!licensing.exclusive,
          geography: licensing.geography,
          comparable_deals: licensing.comparable_deals ? licensing.comparable_deals.split('\n').map(s => s.trim()).filter(Boolean) : [],
        };
      }
      const res = await api.post(tool.endpoint, body);
      const data = res.data;
      setResult({ success: true, content: data.content || data.result || data.analysis || JSON.stringify(data, null, 2), model: data.model, raw: data });
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'AI request failed';
      if (status === 503) {
        const missing = err.response?.data?.missing;
        if (missing && missing !== 'OPENROUTER_API_KEY') {
          setError(`Service unavailable. Missing credentials on the server: ${missing}.`);
        } else {
          setError('AI service unavailable. The OPENROUTER_API_KEY is not configured on the server.');
        }
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="feature-page">
      <div className="feature-page-header">
        <h1>AI Predictive Tools</h1>
        <p>Claim broadness, rejection prediction, and infringement risk</p>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0', flexWrap: 'wrap' }}>
        {TOOLS.map(t => (
          <button
            key={t.id}
            className={`btn ${activeTool === t.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTool(t.id); setResult(null); setError(''); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        {activeTool === 'claim-broadness' && (
          <>
            <h3>Claim Broadness Score</h3>
            <div className="form-group">
              <label>Claim Text *</label>
              <textarea rows={5} value={claim.claim_text} onChange={e => setClaim({ ...claim, claim_text: e.target.value })} placeholder="Paste the claim language..." />
            </div>
            <div className="form-group">
              <label>Field of Art</label>
              <input value={claim.field_of_art} onChange={e => setClaim({ ...claim, field_of_art: e.target.value })} placeholder="Computer-implemented method..." />
            </div>
            <div className="form-group">
              <label>Prior Art Summary</label>
              <textarea rows={3} value={claim.prior_art_summary} onChange={e => setClaim({ ...claim, prior_art_summary: e.target.value })} />
            </div>
          </>
        )}

        {activeTool === 'rejection-predict' && (
          <>
            <h3>Rejection Prediction</h3>
            <div className="form-group">
              <label>Application Text *</label>
              <textarea rows={5} value={rejection.application_text} onChange={e => setRejection({ ...rejection, application_text: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Examiner History</label>
              <textarea rows={3} value={rejection.examiner_history} onChange={e => setRejection({ ...rejection, examiner_history: e.target.value })} placeholder="Recent OAs and allowance rates" />
            </div>
            <div className="form-group">
              <label>Art Unit</label>
              <input value={rejection.art_unit} onChange={e => setRejection({ ...rejection, art_unit: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Similar Filings</label>
              <textarea rows={2} value={rejection.similar_filings} onChange={e => setRejection({ ...rejection, similar_filings: e.target.value })} />
            </div>
          </>
        )}

        {activeTool === 'infringement-risk' && (
          <>
            <h3>Infringement Risk Score</h3>
            <div className="form-group">
              <label>Own Patent (claim text or summary) *</label>
              <textarea rows={5} value={infringe.own_patent} onChange={e => setInfringe({ ...infringe, own_patent: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Suspected Product / Service</label>
              <textarea rows={4} value={infringe.suspected_product} onChange={e => setInfringe({ ...infringe, suspected_product: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Market Summary</label>
              <textarea rows={3} value={infringe.market_summary} onChange={e => setInfringe({ ...infringe, market_summary: e.target.value })} />
            </div>
          </>
        )}

        {activeTool === 'market-threat' && (
          <>
            <h3>Market Threat Score</h3>
            <div className="form-group">
              <label>Technology Domain</label>
              <input value={marketThreat.technology_domain} onChange={e => setMarketThreat({ ...marketThreat, technology_domain: e.target.value })} placeholder="e.g. wireless charging" />
            </div>
            <div className="form-group">
              <label>Market Segment</label>
              <input value={marketThreat.market_segment} onChange={e => setMarketThreat({ ...marketThreat, market_segment: e.target.value })} placeholder="e.g. consumer EVs" />
            </div>
            <div className="form-group">
              <label>Our Position</label>
              <textarea rows={3} value={marketThreat.our_position} onChange={e => setMarketThreat({ ...marketThreat, our_position: e.target.value })} placeholder="Our market share, IP coverage, etc." />
            </div>
            <div className="form-group">
              <label>Competitor Signals (one per line)</label>
              <textarea rows={4} value={marketThreat.competitor_signals} onChange={e => setMarketThreat({ ...marketThreat, competitor_signals: e.target.value })} placeholder={'New filing by Foo Corp\nProduct launch by Bar Inc'} />
            </div>
          </>
        )}

        {activeTool === 'competitor-track' && (
          <>
            <h3>Competitor Innovation Track</h3>
            <div className="form-group">
              <label>Competitor Name *</label>
              <input value={competitorTrack.competitor_name} onChange={e => setCompetitorTrack({ ...competitorTrack, competitor_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Technology Focus</label>
              <input value={competitorTrack.technology_focus} onChange={e => setCompetitorTrack({ ...competitorTrack, technology_focus: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Time Window (months)</label>
              <input type="number" min="1" max="60" value={competitorTrack.time_window_months} onChange={e => setCompetitorTrack({ ...competitorTrack, time_window_months: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Recent Filings (one per line)</label>
              <textarea rows={3} value={competitorTrack.recent_filings} onChange={e => setCompetitorTrack({ ...competitorTrack, recent_filings: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Recent Products / Announcements (one per line)</label>
              <textarea rows={3} value={competitorTrack.recent_products} onChange={e => setCompetitorTrack({ ...competitorTrack, recent_products: e.target.value })} />
            </div>
          </>
        )}

        {activeTool === 'uspto-status' && (
          <>
            <h3>USPTO Status (PAIR / EFS)</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9em' }}>Gated by USPTO_API_KEY. Without it the endpoint returns HTTP 503.</p>
            <div className="form-group">
              <label>Application Number</label>
              <input value={uspto.application_number} onChange={e => setUspto({ ...uspto, application_number: e.target.value })} placeholder="e.g. 16/123,456" />
            </div>
            <div className="form-group">
              <label>Patent Number</label>
              <input value={uspto.patent_number} onChange={e => setUspto({ ...uspto, patent_number: e.target.value })} placeholder="e.g. US10000000B2" />
            </div>
          </>
        )}

        {activeTool === 'pct-coordinator' && (
          <>
            <h3>PCT Coordinator</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9em' }}>Defaults: priority window 12 months, national-phase 30 months, jurisdictions EP/JP/CN/KR/IN.</p>
            <div className="form-group">
              <label>Priority Date *</label>
              <input type="date" value={pct.priority_date} onChange={e => setPct({ ...pct, priority_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Technology Field *</label>
              <input value={pct.technology_field} onChange={e => setPct({ ...pct, technology_field: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Target Markets (comma-separated, e.g. EP,JP,CN)</label>
              <input value={pct.target_markets} onChange={e => setPct({ ...pct, target_markets: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Budget (USD)</label>
              <input type="number" value={pct.budget_usd} onChange={e => setPct({ ...pct, budget_usd: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Commercial Priority Notes</label>
              <textarea rows={3} value={pct.commercial_priority} onChange={e => setPct({ ...pct, commercial_priority: e.target.value })} />
            </div>
          </>
        )}

        {activeTool === 'literature-search' && (
          <>
            <h3>Literature Search</h3>
            <p style={{ color: '#6b7280', fontSize: '0.9em' }}>Gated by PUBMED_API_KEY and/or ARXIV_API_KEY. Without either the endpoint returns HTTP 503.</p>
            <div className="form-group">
              <label>Query *</label>
              <input value={lit.query} onChange={e => setLit({ ...lit, query: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Max Results</label>
              <input type="number" value={lit.max_results} onChange={e => setLit({ ...lit, max_results: e.target.value })} />
            </div>
          </>
        )}

        {activeTool === 'inventor-tracking' && (
          <>
            <h3>Inventor Tracking</h3>
            <div className="form-group">
              <label>Inventor Name *</label>
              <input value={inventor.inventor_name} onChange={e => setInventor({ ...inventor, inventor_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Organization</label>
              <input value={inventor.organization} onChange={e => setInventor({ ...inventor, organization: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Time Range (years)</label>
              <input type="number" value={inventor.time_range_years} onChange={e => setInventor({ ...inventor, time_range_years: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Known Filings (one per line)</label>
              <textarea rows={3} value={inventor.known_filings} onChange={e => setInventor({ ...inventor, known_filings: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Known Assignments (one per line)</label>
              <textarea rows={3} value={inventor.known_assignments} onChange={e => setInventor({ ...inventor, known_assignments: e.target.value })} />
            </div>
          </>
        )}

        {activeTool === 'licensing' && (
          <>
            <h3>Licensing Recommendation (non-binding)</h3>
            <div className="form-group">
              <label>Technology Summary *</label>
              <textarea rows={4} value={licensing.technology_summary} onChange={e => setLicensing({ ...licensing, technology_summary: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Target Industries (comma-separated)</label>
              <input value={licensing.target_industries} onChange={e => setLicensing({ ...licensing, target_industries: e.target.value })} />
            </div>
            <div className="form-group">
              <label>
                <input type="checkbox" checked={licensing.exclusive} onChange={e => setLicensing({ ...licensing, exclusive: e.target.checked })} /> Exclusive
              </label>
            </div>
            <div className="form-group">
              <label>Geography</label>
              <input value={licensing.geography} onChange={e => setLicensing({ ...licensing, geography: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Comparable Deals (one per line)</label>
              <textarea rows={3} value={licensing.comparable_deals} onChange={e => setLicensing({ ...licensing, comparable_deals: e.target.value })} />
            </div>
          </>
        )}

        <button className="btn btn-primary" onClick={run} disabled={loading} style={{ marginTop: 16 }}>
          {loading ? 'Running...' : 'Run AI'}
        </button>

        {error && <div style={{ color: '#ef4444', marginTop: 12 }}>{error}</div>}
      </div>

      <AIResultDisplay result={result} />
    </div>
  );
}
