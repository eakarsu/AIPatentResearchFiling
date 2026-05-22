// === Batch 06 Gaps & Frontend Mounts ===
// Gap Feature: Competitor without '/competitor
// Competitor without /competitor-innovation-track (identify emerging patent trends in market)
// Project: AIPatentResearchFiling
// ESM version (converted from CJS scaffold).

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { aiRateLimiter as _aiRateLimiter } from '../middleware/rateLimiter.js';
import pool from '../models/db.js';

const router = express.Router();
const auth = authenticate;
const aiRateLimiter = _aiRateLimiter;
const _pool = pool;

async function callLLM(systemPrompt, userPrompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'AIPatentResearchFiling / gap-competitor-without-competitor',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content || '',
    tokensUsed: data.usage?.total_tokens || 0,
    model: data.model || null,
  };
}

let _tableReady = false;
async function ensureTable() {
  if (_tableReady) return;
  if (!_pool) return;
  try {
    await _pool.query(`CREATE TABLE IF NOT EXISTS gap_features (
      id SERIAL PRIMARY KEY,
      feature_slug VARCHAR(120),
      user_id INTEGER,
      input JSONB,
      result TEXT,
      tokens_used INTEGER,
      model VARCHAR(120),
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    _tableReady = true;
  } catch (e) {
    console.warn('gap_features table init failed:', e.message);
  }
}

router.post('/run', auth, aiRateLimiter, async (req, res) => {
  try {
    const payload = req.body || {};
    const systemPrompt = `You are an expert assistant for the gap feature: 'Competitor without \'/competitor'.\nProject: AIPatentResearchFiling.\nContext: Competitor without /competitor-innovation-track (identify emerging patent trends in market)\nReturn structured JSON with keys: { summary: string, recommendations: string[], risks: string[], next_steps: string[] }.`;
    const userPrompt = `Input payload:\n${JSON.stringify(payload, null, 2)}`;
    const out = await callLLM(systemPrompt, userPrompt);

    await ensureTable();
    let savedId = null;
    if (_pool && _tableReady) {
      try {
        const r = await _pool.query(
          'INSERT INTO gap_features (feature_slug, user_id, input, result, tokens_used, model) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
          ['competitor-without-competitor', req.user?.id || null, JSON.stringify(payload), out.content, out.tokensUsed, out.model]
        );
        savedId = r.rows[0]?.id || null;
      } catch (e) {
        console.warn('gap_features insert failed:', e.message);
      }
    }

    res.json({ ok: true, id: savedId, feature: 'competitor-without-competitor', result: out.content, tokens_used: out.tokensUsed, model: out.model });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Internal error' });
  }
});

router.get('/history', auth, aiRateLimiter, async (req, res) => {
  try {
    await ensureTable();
    if (!_pool || !_tableReady) return res.json({ items: [] });
    const r = await _pool.query(
      "SELECT id, input, result, tokens_used, model, created_at FROM gap_features WHERE feature_slug = $1 ORDER BY id DESC LIMIT 25",
      ['competitor-without-competitor']
    );
    res.json({ items: r.rows });
  } catch (e) {
    res.status(500).json({ error: e.message || 'Internal error' });
  }
});

export default router;
