import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET: Lista todas as RFPs
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM RFP');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET: Busca RFP por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM RFP WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'RFP not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere nova RFP
router.post('/', async (req, res) => {
  try {
    const { title, description, created_by, status, approved_at, approved_by, approval_notes } = req.body;
    const result = await query(
      `INSERT INTO RFP 
       (title, description, created_by, status, approved_at, approved_by, approval_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, description, created_by, status || 'pending', approved_at, approved_by, approval_notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza RFP por ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, created_by, status, approved_at, approved_by, approval_notes } = req.body;
    const result = await query(
      `UPDATE RFP
       SET title = $1, description = $2, created_by = $3, status = $4,
           approved_at = $5, approved_by = $6, approval_notes = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [title, description, created_by, status, approved_at, approved_by, approval_notes, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'RFP not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove RFP por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM RFP WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;