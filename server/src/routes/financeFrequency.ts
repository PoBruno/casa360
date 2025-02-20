import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET TUDO: Lista todas as frequências financeiras
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Finance_Frequency');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET POR ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM Finance_Frequency WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Registro não encontrado' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere uma nova frequência financeira
router.post('/', async (req, res) => {
  try {
    const { name, days_interval } = req.body;
    const result = await query(
      `INSERT INTO Finance_Frequency (name, days_interval)
       VALUES ($1, $2) RETURNING *`,
      [name, days_interval]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza uma frequência financeira
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, days_interval } = req.body;
    const result = await query(
      `UPDATE Finance_Frequency
       SET name = $1, days_interval = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [name, days_interval, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Registro não encontrado' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove uma frequência financeira
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Finance_Frequency WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;
