import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET: Lista todas as moedas/taxas de câmbio
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Finance_Currency');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET: Retorna uma moeda por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM Finance_Currency WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Finance_Currency not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere uma nova moeda
router.post('/', async (req, res) => {
  try {
    const { name, symbol, exchange_rate } = req.body;
    const result = await query(
      `INSERT INTO Finance_Currency (name, symbol, exchange_rate)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, symbol, exchange_rate]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza uma moeda por ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, symbol, exchange_rate } = req.body;
    const result = await query(
      `UPDATE Finance_Currency
       SET name = $1, symbol = $2, exchange_rate = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [name, symbol, exchange_rate, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Finance_Currency not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove uma moeda por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Finance_Currency WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;