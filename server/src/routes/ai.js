import { Router } from 'express';
import pool from '../models/db.js';
import { authenticate } from '../middleware/auth.js';
import { callOpenRouter } from '../services/openrouter.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';
import { parseAIJson, persistAIAnalysis } from './routeFactory.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = Router();

// GET /api/ai/history - paginated AI analysis history for logged-in user
router.get('/history', authenticate, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const [rows, count] = await Promise.all([
      pool.query(
        `SELECT * FROM ai_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      ),
      pool.query(`SELECT COUNT(*) FROM ai_analyses WHERE user_id = $1`, [req.user.id]),
    ]);

    res.json({
      data: rows.rows,
      page,
      limit,
      total: parseInt(count.rows[0].count),
      totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/prior-art-search - enhanced prior art with structured JSON
router.post('/prior-art-search', authenticate, aiRateLimiter, async (req, res) => {
  try {
    const { query, patent_class } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const systemPrompt = 'You are an expert patent prior art search assistant. Return only valid JSON, no markdown, no extra text.';
    const userPrompt = `Search for prior art patents related to: ${query}${patent_class ? ` in patent class ${patent_class}` : ''}.

Generate 5 realistic prior art patent references. Return ONLY valid JSON in this exact format:
{
  "relevant_patents": [
    {
      "patent_number": "US1234567B2",
      "title": "Title of the patent",
      "filing_date": "YYYY-MM-DD",
      "assignee": "Company Name",
      "relevance_score": 85,
      "abstract": "Brief description of the patent and why it is relevant."
    }
  ],
  "novelty_score": 72,
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2"
  ]
}`;

    const aiResult = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(aiResult.result);

    await persistAIAnalysis({
      userId: req.user?.id,
      endpoint: 'prior-art-search',
      patentId: null,
      result: aiResult.result,
      model: aiResult.model,
      tableName: null,
    });

    res.json({ success: aiResult.success, result: aiResult.result, parsed, model: aiResult.model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/patent-search-analyze - structured patent search analysis
router.post('/patent-search-analyze', authenticate, aiRateLimiter, async (req, res) => {
  try {
    const { query, technology_area } = req.body;
    if (!query) return res.status(400).json({ error: 'query is required' });

    const systemPrompt = 'You are an expert patent search analyst. Return only valid JSON, no markdown.';
    const userPrompt = `Analyze patent search results for: "${query}"${technology_area ? ` in ${technology_area}` : ''}.

Return ONLY valid JSON:
{
  "relevant_patents": [
    {
      "patent_number": "US1234567B2",
      "title": "Patent title",
      "similarity_score": 85,
      "abstract": "Brief abstract"
    }
  ],
  "novelty_score": 72,
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

    const aiResult = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseAIJson(aiResult.result);

    await persistAIAnalysis({
      userId: req.user?.id,
      endpoint: 'patent-search-analyze',
      patentId: null,
      result: aiResult.result,
      model: aiResult.model,
      tableName: null,
    });

    res.json({ success: aiResult.success, result: aiResult.result, parsed, model: aiResult.model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/patents/:id/export-pdf - PDF export
router.get('/patents/:id/export-pdf', authenticate, async (req, res) => {
  try {
    let PDFDocument;
    try {
      PDFDocument = require('pdfkit');
    } catch {
      return res.status(500).json({ error: 'pdfkit not installed. Run: npm install pdfkit' });
    }

    // Try to get patent from common tables
    let patent = null;
    const tables = ['patent_drafts', 'patent_searches', 'filings'];
    for (const tbl of tables) {
      try {
        const r = await pool.query(`SELECT * FROM ${tbl} WHERE id = $1`, [req.params.id]);
        if (r.rows.length > 0) { patent = r.rows[0]; break; }
      } catch {}
    }

    if (!patent) return res.status(404).json({ error: 'Patent not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="patent-${req.params.id}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('AI Patent Research & Filing', { align: 'center' });
    doc.fontSize(12).font('Helvetica').text('Patent Document Export', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Title
    const title = patent.title || patent.application_title || 'Untitled Patent';
    doc.fontSize(16).font('Helvetica-Bold').text(title);
    doc.moveDown(0.5);

    // Fields
    const fieldMap = [
      ['Application Number', patent.application_number],
      ['Jurisdiction', patent.jurisdiction],
      ['Filing Type', patent.filing_type],
      ['Status', patent.status],
      ['Inventors', patent.inventors],
      ['Attorney', patent.attorney],
      ['Filing Date', patent.filing_date],
      ['Deadline', patent.deadline],
      ['Estimated Cost', patent.estimated_cost],
      ['Technology Field', patent.technical_field || patent.technology_area],
    ];

    doc.fontSize(11).font('Helvetica');
    for (const [label, value] of fieldMap) {
      if (value) {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(value);
      }
    }
    doc.moveDown();

    // Description / Summary
    const description = patent.invention_summary || patent.description || patent.abstract || '';
    if (description) {
      doc.font('Helvetica-Bold').fontSize(13).text('Description / Summary');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(11).text(description, { align: 'justify' });
      doc.moveDown();
    }

    // Claims
    if (patent.claims_text) {
      doc.font('Helvetica-Bold').fontSize(13).text('Claims');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(11).text(patent.claims_text, { align: 'justify' });
      doc.moveDown();
    }

    // AI Analysis
    if (patent.ai_analysis) {
      doc.font('Helvetica-Bold').fontSize(13).text('AI Analysis');
      doc.moveDown(0.3);
      doc.font('Helvetica').fontSize(10).text(patent.ai_analysis, { align: 'justify' });
    }

    // Footer
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(9).fillColor('#888').text(
      `Generated by AI Patent Research & Filing Platform on ${new Date().toLocaleString()}`,
      { align: 'center' }
    );

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/claim-broadness-score
router.post('/claim-broadness-score', authenticate, aiRateLimiter, async (req, res) => {
  try {
    const { claim_text, claims, patent_id } = req.body || {};
    const claimsList = claims || (claim_text ? [claim_text] : []);
    if (claimsList.length === 0) return res.status(400).json({ error: 'claim_text or claims[] required' });

    const systemPrompt = 'You are a patent claim-scope analyst. Return ONLY valid JSON, no markdown.';
    const userPrompt = `Score the broadness and litigation risk of these claims.
Claims: ${JSON.stringify(claimsList)}

Return JSON:
{ "claim_scores": [{"index": number, "broadness_score_0_100": number, "specificity_score_0_100": number, "key_terms_too_broad": [string], "litigation_risk": "low|medium|high", "drafting_suggestions": [string]}], "overall_broadness": "narrow|balanced|broad", "litigation_risk_summary": string }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    await persistAIAnalysis({ userId: req.user.id, endpoint: 'claim-broadness-score', patentId: patent_id || null, result: result.content, model: result.model });
    res.json({ analysis: result.content, parsed: parseAIJson(result.content), model: result.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/rejection-predict
router.post('/rejection-predict', authenticate, aiRateLimiter, async (req, res) => {
  try {
    const { abstract, claims, prior_art_summary, jurisdiction, patent_id } = req.body || {};
    const systemPrompt = 'You predict USPTO/PCT office-action outcomes. Return ONLY valid JSON.';
    const userPrompt = `Predict examiner rejection likelihood and reasons.
Jurisdiction: ${jurisdiction || 'USPTO'}
Abstract: ${abstract || ''}
Claims: ${JSON.stringify(claims || [])}
Prior art summary: ${prior_art_summary || ''}

Return JSON:
{ "rejection_probability": number, "likely_rejections": [{"type": "102|103|112|101|other", "explanation": string, "severity": "low|medium|high"}], "responses_to_prepare": [string], "claim_amendments_recommended": [string], "confidence": "low|medium|high" }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    await persistAIAnalysis({ userId: req.user.id, endpoint: 'rejection-predict', patentId: patent_id || null, result: result.content, model: result.model });
    res.json({ analysis: result.content, parsed: parseAIJson(result.content), model: result.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/infringement-risk-score
router.post('/infringement-risk-score', authenticate, aiRateLimiter, async (req, res) => {
  try {
    const { our_patent_claims, target_product_description, patent_id } = req.body || {};
    if (!target_product_description) return res.status(400).json({ error: 'target_product_description required' });
    const systemPrompt = 'You assess infringement risk between patent claims and a competitor product. Return ONLY valid JSON.';
    const userPrompt = `Compare our claims against a target product.
Our claims: ${JSON.stringify(our_patent_claims || [])}
Target product: ${target_product_description}

Return JSON:
{ "infringement_risk_score_0_100": number, "claim_by_claim": [{"claim_index": number, "matched_elements": [string], "missing_elements": [string], "verdict": "likely-infringing|possibly-infringing|unlikely"}], "doctrine_of_equivalents_concerns": [string], "design-around_suggestions": [string], "litigation_recommendation": "monitor|engage|license-offer|cease-and-desist" }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    await persistAIAnalysis({ userId: req.user.id, endpoint: 'infringement-risk-score', patentId: patent_id || null, result: result.content, model: result.model });
    res.json({ analysis: result.content, parsed: parseAIJson(result.content), model: result.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/market-threat-score
router.post('/market-threat-score', authenticate, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_key_here') {
      return res.status(503).json({ error: 'AI service unavailable. OPENROUTER_API_KEY is not configured on the server.' });
    }
    const { patent_id, technology_domain, market_segment, our_position, competitor_signals } = req.body || {};
    if (!technology_domain && !market_segment) {
      return res.status(400).json({ error: 'technology_domain or market_segment is required' });
    }
    const systemPrompt = 'You assess market-level threats to a patent or patent portfolio. Return ONLY valid JSON, no markdown.';
    const userPrompt = `Score the market threat surrounding this technology / segment.
Technology domain: ${technology_domain || 'n/a'}
Market segment: ${market_segment || 'n/a'}
Our position: ${our_position || 'n/a'}
Competitor signals: ${JSON.stringify(competitor_signals || [])}

Return JSON:
{ "market_threat_score_0_100": number, "threat_tier": "low|moderate|high|critical", "key_threat_drivers": [string], "vulnerable_claim_areas": [string], "displacement_risk": "low|medium|high", "time_horizon_months": number, "recommended_defensive_actions": [string], "recommended_offensive_actions": [string], "monitoring_signals": [string] }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    if (result && result.success === false) {
      return res.status(503).json({ error: result.result || 'AI service unavailable.' });
    }
    const content = result.content || result.result;
    await persistAIAnalysis({ userId: req.user.id, endpoint: 'market-threat-score', patentId: patent_id || null, result: content, model: result.model });
    res.json({ analysis: content, parsed: parseAIJson(content), model: result.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/ai/competitor-innovation-track
router.post('/competitor-innovation-track', authenticate, aiRateLimiter, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_key_here') {
      return res.status(503).json({ error: 'AI service unavailable. OPENROUTER_API_KEY is not configured on the server.' });
    }
    const { competitor_name, technology_focus, recent_filings, recent_products, time_window_months, patent_id } = req.body || {};
    if (!competitor_name) {
      return res.status(400).json({ error: 'competitor_name is required' });
    }
    const systemPrompt = 'You track competitor innovation activity from filings and product signals. Return ONLY valid JSON, no markdown.';
    const userPrompt = `Profile this competitor's innovation trajectory.
Competitor: ${competitor_name}
Technology focus: ${technology_focus || 'n/a'}
Time window (months): ${time_window_months || 12}
Recent filings: ${JSON.stringify(recent_filings || [])}
Recent products / announcements: ${JSON.stringify(recent_products || [])}

Return JSON:
{ "innovation_velocity": "low|moderate|high|surging", "primary_focus_areas": [string], "emerging_focus_areas": [string], "patent_filing_trend": "declining|flat|growing|aggressive", "white_space_opportunities_for_us": [string], "competitive_threats": [string], "watchlist_keywords": [string], "recommended_response_actions": [string], "estimated_rd_intensity": "low|medium|high|very-high" }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    if (result && result.success === false) {
      return res.status(503).json({ error: result.result || 'AI service unavailable.' });
    }
    const content = result.content || result.result;
    await persistAIAnalysis({ userId: req.user.id, endpoint: 'competitor-innovation-track', patentId: patent_id || null, result: content, model: result.model });
    res.json({ analysis: content, parsed: parseAIJson(content), model: result.model });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =====================================================================
// Apply pass 5 — additive endpoints
// ENV VARS used:
//   OPENROUTER_API_KEY       — required by all AI endpoints
//   USPTO_API_KEY            — required by uspto-status
//   PUBMED_API_KEY           — required by literature-search (optional pair)
//   ARXIV_API_KEY            — required by literature-search (optional pair)
// =====================================================================

function aiKeyMissing() {
  const k = process.env.OPENROUTER_API_KEY;
  return !k || k === 'your_openrouter_key_here' || k === 'your_openrouter_api_key_here';
}

// POST /api/ai/uspto-status — USPTO PAIR / EFS integration stub.
// NEEDS-CREDS: gates on USPTO_API_KEY. Without the key returns 503 with
// `missing: USPTO_API_KEY`. With the key we return a stub payload (no live
// PAIR HTTP call — keeps this additive and dependency-free).
router.post('/uspto-status', authenticate, aiRateLimiter, async (req, res) => {
  if (!process.env.USPTO_API_KEY) {
    return res.status(503).json({
      error: 'USPTO integration unavailable. USPTO_API_KEY not configured.',
      missing: 'USPTO_API_KEY',
    });
  }
  try {
    const { application_number, patent_number } = req.body || {};
    if (!application_number && !patent_number) {
      return res.status(400).json({ error: 'application_number or patent_number is required' });
    }
    res.json({
      success: true,
      application_number: application_number || null,
      patent_number: patent_number || null,
      status: 'unknown',
      events: [],
      note: 'USPTO PAIR integration stub — credentials present but live PAIR/EFS calls are not wired in this pass.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/pct-coordinator — PCT filing strategy coordinator.
// PRODUCT-DECISION: default jurisdictions = ["EP","JP","CN","KR","IN"];
// priority window deadline = priority_date + 12 months; PCT national-phase
// deadline = priority_date + 30 months. Strategy is recommendation-only.
router.post('/pct-coordinator', authenticate, aiRateLimiter, async (req, res) => {
  try {
    if (aiKeyMissing()) {
      return res.status(503).json({ error: 'AI service unavailable. OPENROUTER_API_KEY is not configured on the server.', missing: 'OPENROUTER_API_KEY' });
    }
    const {
      patent_id, priority_date, technology_field, target_markets, budget_usd,
      commercial_priority,
    } = req.body || {};
    if (!priority_date || !technology_field) {
      return res.status(400).json({ error: 'priority_date and technology_field are required' });
    }
    const defaultMarkets = ['EP', 'JP', 'CN', 'KR', 'IN'];
    const markets = (target_markets && target_markets.length) ? target_markets : defaultMarkets;
    const systemPrompt = 'You are a PCT filing strategist. Recommend a PCT national-phase strategy. Return ONLY valid JSON, no markdown.';
    const userPrompt = `Recommend a PCT filing strategy.
Priority date: ${priority_date}
Technology field: ${technology_field}
Target markets considered: ${JSON.stringify(markets)}
Budget (USD): ${budget_usd || 'n/a'}
Commercial priority notes: ${commercial_priority || 'n/a'}

Calendar reference (do not alter):
- Priority window deadline: ${priority_date} + 12 months
- PCT national-phase deadline: ${priority_date} + 30 months

Return JSON:
{ "recommended_jurisdictions": [{"code": string, "rationale": string, "priority_rank": number, "estimated_cost_usd": number}], "skip_jurisdictions": [{"code": string, "reason": string}], "filing_calendar": [{"event": string, "due_date_iso": string}], "budget_total_estimated_usd": number, "key_risks": [string], "alternative_strategies": [string] }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    if (result && result.success === false) {
      return res.status(503).json({ error: result.result || 'AI service unavailable.', missing: 'OPENROUTER_API_KEY' });
    }
    const content = result.content || result.result;
    await persistAIAnalysis({ userId: req.user.id, endpoint: 'pct-coordinator', patentId: patent_id || null, result: content, model: result.model });
    res.json({ analysis: content, parsed: parseAIJson(content), model: result.model, defaults: { jurisdictions: defaultMarkets, priority_months: 12, national_phase_months: 30 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/literature-search — PubMed / arXiv literature stub.
// NEEDS-CREDS: gates on PUBMED_API_KEY OR ARXIV_API_KEY. Without either,
// returns 503 with `missing: PUBMED_API_KEY,ARXIV_API_KEY`. With creds we
// return a configured-providers stub (no live HTTP fetch in this pass).
router.post('/literature-search', authenticate, aiRateLimiter, async (req, res) => {
  const hasPubmed = !!process.env.PUBMED_API_KEY;
  const hasArxiv = !!process.env.ARXIV_API_KEY;
  if (!hasPubmed && !hasArxiv) {
    return res.status(503).json({
      error: 'Literature search unavailable. No literature provider credentials configured.',
      missing: 'PUBMED_API_KEY,ARXIV_API_KEY',
    });
  }
  try {
    const { query, max_results } = req.body || {};
    if (!query) return res.status(400).json({ error: 'query is required' });
    res.json({
      success: true,
      query,
      max_results: Number(max_results) || 10,
      providers: { pubmed: hasPubmed, arxiv: hasArxiv },
      results: [],
      note: 'Literature search stub — credentials present but live PubMed/arXiv HTTP calls are not wired in this pass.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/inventor-tracking — additive AI-only inventor / assignment
// tracking. Persists into ai_analyses (existing). No new tables introduced.
// PRODUCT-DECISION: returns a normalized JSON model so the FE can render a
// timeline and an assignment-chain audit. Read-only.
router.post('/inventor-tracking', authenticate, aiRateLimiter, async (req, res) => {
  try {
    if (aiKeyMissing()) {
      return res.status(503).json({ error: 'AI service unavailable. OPENROUTER_API_KEY is not configured on the server.', missing: 'OPENROUTER_API_KEY' });
    }
    const { patent_id, inventor_name, organization, time_range_years, known_filings, known_assignments } = req.body || {};
    if (!inventor_name) return res.status(400).json({ error: 'inventor_name is required' });
    const systemPrompt = 'You are a patent inventor / assignment chain analyst. Return ONLY valid JSON, no markdown.';
    const userPrompt = `Profile this inventor's filing history and assignment chain.
Inventor: ${inventor_name}
Current organization: ${organization || 'n/a'}
Window (years): ${time_range_years || 10}
Known filings: ${JSON.stringify(known_filings || [])}
Known assignments: ${JSON.stringify(known_assignments || [])}

Return JSON:
{ "inventor": string, "filing_count_estimated": number, "primary_technology_areas": [string], "co_inventor_clusters": [string], "assignment_chain": [{"date_iso": string, "from": string, "to": string, "filing_or_patent": string, "type": "assignment|license|merger|other"}], "data_gaps": [string], "follow_up_questions": [string], "confidence": "low|medium|high" }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    if (result && result.success === false) {
      return res.status(503).json({ error: result.result || 'AI service unavailable.', missing: 'OPENROUTER_API_KEY' });
    }
    const content = result.content || result.result;
    await persistAIAnalysis({ userId: req.user.id, endpoint: 'inventor-tracking', patentId: patent_id || null, result: content, model: result.model });
    res.json({ analysis: content, parsed: parseAIJson(content), model: result.model });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/licensing-recommendation — patent licensing marketplace stub.
// PRODUCT-DECISION: marketplace transactions are out of scope. Endpoint
// produces a non-binding licensing recommendation (rate band, term length,
// field-of-use carve-outs) suitable for human review.
router.post('/licensing-recommendation', authenticate, aiRateLimiter, async (req, res) => {
  try {
    if (aiKeyMissing()) {
      return res.status(503).json({ error: 'AI service unavailable. OPENROUTER_API_KEY is not configured on the server.', missing: 'OPENROUTER_API_KEY' });
    }
    const { patent_id, technology_summary, target_industries, exclusive, geography, comparable_deals } = req.body || {};
    if (!technology_summary) return res.status(400).json({ error: 'technology_summary is required' });
    const systemPrompt = 'You are a patent licensing strategist. Recommend a non-binding licensing structure. Return ONLY valid JSON, no markdown.';
    const userPrompt = `Recommend licensing terms for this patent / portfolio.
Technology summary: ${technology_summary}
Target industries: ${JSON.stringify(target_industries || [])}
Exclusivity requested: ${exclusive ? 'yes' : 'no'}
Geography: ${geography || 'global'}
Comparable deals (free-form): ${JSON.stringify(comparable_deals || [])}

Return JSON:
{ "recommended_structure": "exclusive|non-exclusive|sole|hybrid", "royalty_rate_band_pct": {"low": number, "mid": number, "high": number}, "lump_sum_band_usd": {"low": number, "mid": number, "high": number}, "term_length_years": number, "field_of_use_carve_outs": [string], "geography_scope": string, "audit_rights": [string], "term_sheet_outline": [string], "deal_risks": [string], "next_steps": [string] }`;
    const result = await callOpenRouter(systemPrompt, userPrompt);
    if (result && result.success === false) {
      return res.status(503).json({ error: result.result || 'AI service unavailable.', missing: 'OPENROUTER_API_KEY' });
    }
    const content = result.content || result.result;
    await persistAIAnalysis({ userId: req.user.id, endpoint: 'licensing-recommendation', patentId: patent_id || null, result: content, model: result.model });
    res.json({ analysis: content, parsed: parseAIJson(content), model: result.model, note: 'Non-binding recommendation — for human review only.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
