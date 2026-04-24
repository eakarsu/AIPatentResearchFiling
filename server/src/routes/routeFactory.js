import { Router } from 'express';
import pool from '../models/db.js';
import { authenticate } from '../middleware/auth.js';
import { callOpenRouter } from '../services/openrouter.js';

export function createCrudRoutes(tableName, aiConfig) {
  const router = Router();

  // Get all items
  router.get('/', authenticate, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
      res.json(result.rows);
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

  // Create item
  router.post('/', authenticate, async (req, res) => {
    try {
      const fields = Object.keys(req.body);
      const values = Object.values(req.body);
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

  // Update item
  router.put('/:id', authenticate, async (req, res) => {
    try {
      const fields = Object.keys(req.body);
      const values = Object.values(req.body);
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
    router.post('/ai-analyze', authenticate, async (req, res) => {
      try {
        const { prompt, context } = req.body;
        const systemPrompt = aiConfig.systemPrompt;
        const userPrompt = context ? `${prompt}\n\nContext:\n${context}` : prompt;
        const aiResult = await callOpenRouter(systemPrompt, userPrompt);
        res.json(aiResult);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // AI analyze specific item
    router.post('/:id/ai-analyze', authenticate, async (req, res) => {
      try {
        const item = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
        if (item.rows.length === 0) return res.status(404).json({ error: 'Not found' });

        const { action } = req.body;
        const systemPrompt = aiConfig.systemPrompt;
        const userPrompt = `${action || aiConfig.defaultAction}\n\nData:\n${JSON.stringify(item.rows[0], null, 2)}`;
        const aiResult = await callOpenRouter(systemPrompt, userPrompt);
        res.json(aiResult);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  return router;
}
