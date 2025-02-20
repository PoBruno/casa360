import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET: Lista todos os pagadores
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Finance_Payer');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET: Retorna um pagador por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM Finance_Payer WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Finance_Payer not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere um novo pagador
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await query(
      'INSERT INTO Finance_Payer (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza um pagador por ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await query(
      'UPDATE Finance_Payer SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [name, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Finance_Payer not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove um pagador por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Finance_Payer WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;