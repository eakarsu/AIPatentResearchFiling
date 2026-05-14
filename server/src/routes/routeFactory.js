import { Router } from 'express';
import pool from '../models/db.js';
import { authenticate } from '../middleware/auth.js';
import { callOpenRouter } from '../services/openrouter.js';
import { aiRateLimiter } from '../middleware/rateLimiter.js';

// Bootstrap ai_analyses table and add ai_analysis column to all tables on first import
let bootstrapped = false;
async function ensureAiTables() {
  if (bootstrapped) return;
  bootstrapped = true;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        endpoint VARCHAR(100),
        patent_id INTEGER,
        result TEXT,
        result_json JSONB,
        model VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  } catch (err) {
    console.error('ai_analyses bootstrap error:', err.message);
  }
}
ensureAiTables();

// 3-strategy JSON parser
function parseAIJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const md = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (md) { try { return JSON.parse(md[1].trim()); } catch {} }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return JSON.parse(objMatch[0]); } catch {} }
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch {} }
  return null;
}

async function persistAIAnalysis({ userId, endpoint, patentId, result, model, tableName }) {
  try {
    const parsed = parseAIJson(result);
    await pool.query(
      `INSERT INTO ai_analyses (user_id, endpoint, patent_id, result, result_json, model) VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, endpoint, patentId || null, result, parsed ? JSON.stringify(parsed) : null, model || null]
    );
    // Update source row's ai_analysis column if table and id are available
    if (tableName && patentId) {
      try {
        await pool.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ai_analysis TEXT`);
        await pool.query(`UPDATE ${tableName} SET ai_analysis = $1 WHERE id = $2`, [result, patentId]);
      } catch {}
    }
  } catch (err) {
    console.error('persistAIAnalysis error:', err.message);
  }
}

// Allowed fields per table to prevent mass-assignment
const ALLOWED_FIELDS = {
  patent_searches: ['title', 'query', 'technology_area', 'description', 'status', 'results_count', 'user_id'],
  prior_art_analyses: ['invention_title', 'invention_description', 'technology_field', 'status', 'novelty_score', 'references_found', 'analysis_result', 'user_id'],
  patent_drafts: ['title', 'invention_summary', 'technical_field', 'inventors', 'abstract', 'description', 'status', 'user_id'],
  claims: ['patent_title', 'invention_description', 'claim_type', 'num_independent', 'num_dependent', 'claims_text', 'status', 'user_id'],
  classifications: ['patent_title', 'description', 'technology_sector', 'ipc_codes', 'cpc_codes', 'confidence_score', 'status', 'user_id'],
  infringement_analyses: ['patent_number', 'patent_title', 'accused_product', 'analysis_type', 'risk_level', 'claim_mapping', 'status', 'user_id'],
  valuations: ['patent_number', 'patent_title', 'technology_area', 'valuation_method', 'estimated_value', 'market_size', 'remaining_life', 'status', 'user_id'],
  portfolios: ['portfolio_name', 'owner', 'total_patents', 'technology_areas', 'total_value', 'strength_score', 'status', 'description', 'user_id'],
  competitor_monitors: ['competitor_name', 'technology_area', 'recent_filings', 'threat_level', 'key_patents', 'notes', 'monitoring_status', 'user_id'],
  filings: ['application_title', 'application_number', 'jurisdiction', 'filing_type', 'attorney', 'estimated_cost', 'filing_date', 'deadline', 'notes', 'status', 'user_id'],
  citation_analyses: ['patent_number', 'patent_title', 'forward_citations', 'backward_citations', 'citation_score', 'influential_citations', 'status', 'user_id'],
  translations: ['patent_title', 'source_language', 'target_language', 'original_text', 'translated_text', 'word_count', 'status', 'user_id'],
  landscape_analyses: ['technology_area', 'scope', 'time_period', 'total_patents_analyzed', 'key_players', 'white_spaces', 'trends', 'status', 'user_id'],
  renewals: ['patent_number', 'patent_title', 'jurisdiction', 'renewal_date', 'renewal_fee', 'priority', 'auto_renew', 'notes', 'status', 'user_id'],
  collaboration_tasks: ['title', 'description', 'assigned_to', 'task_type', 'priority', 'due_date', 'patent_reference', 'comments', 'status', 'user_id'],
};

function filterFields(tableName, body) {
  const allowed = ALLOWED_FIELDS[tableName];
  if (!allowed) return body; // fallback: allow all if table not listed
  const filtered = {};
  for (const key of allowed) {
    if (body[key] !== undefined) filtered[key] = body[key];
  }
  return filtered;
}

export function createCrudRoutes(tableName, aiConfig) {
  const router = Router();

  // Get all items - paginated
  router.get('/', authenticate, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const offset = (page - 1) * limit;
      const [result, count] = await Promise.all([
        pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
        pool.query(`SELECT COUNT(*) FROM ${tableName}`),
      ]);
      res.json({
        data: result.rows,
        page,
        limit,
        total: parseInt(count.rows[0].count),
        totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single item
  router.get('/:id', authenticate, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create item - field whitelist applied
  router.post('/', authenticate, async (req, res) => {
    try {
      const body = filterFields(tableName, req.body);
      const fields = Object.keys(body);
      const values = Object.values(body);
      if (fields.length === 0) return res.status(400).json({ error: 'No valid fields provided' });
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update item - field whitelist applied
  router.put('/:id', authenticate, async (req, res) => {
    try {
      const body = filterFields(tableName, req.body);
      const fields = Object.keys(body);
      const values = Object.values(body);
      if (fields.length === 0) return res.status(400).json({ error: 'No valid fields provided' });
      const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const result = await pool.query(
        `UPDATE ${tableName} SET ${setClause}, updated_at = NOW() WHERE id = $${values.length + 1} RETURNING *`,
        [...values, req.params.id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete item
  router.delete('/:id', authenticate, async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI analyze endpoint
  if (aiConfig) {
    router.post('/ai-analyze', authenticate, aiRateLimiter, async (req, res) => {
      try {
        const { prompt, context } = req.body;
        const systemPrompt = aiConfig.systemPrompt;
        const userPrompt = context ? `${prompt}\n\nContext:\n${context}` : prompt;
        const aiResult = await callOpenRouter(systemPrompt, userPrompt);
        await persistAIAnalysis({
          userId: req.user?.id,
          endpoint: `${tableName}/ai-analyze`,
          patentId: null,
          result: aiResult.result,
          model: aiResult.model,
          tableName: null,
        });
        res.json(aiResult);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // AI analyze specific item
    router.post('/:id/ai-analyze', authenticate, aiRateLimiter, async (req, res) => {
      try {
        const item = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
        if (item.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const { action } = req.body;
        const systemPrompt = aiConfig.systemPrompt;
        const userPrompt = `${action || aiConfig.defaultAction}\n\nData:\n${JSON.stringify(item.rows[0], null, 2)}`;
        const aiResult = await callOpenRouter(systemPrompt, userPrompt);
        await persistAIAnalysis({
          userId: req.user?.id,
          endpoint: `${tableName}/${req.params.id}/ai-analyze`,
          patentId: parseInt(req.params.id),
          result: aiResult.result,
          model: aiResult.model,
          tableName,
        });
        res.json(aiResult);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  return router;
}

export { parseAIJson, persistAIAnalysis };
