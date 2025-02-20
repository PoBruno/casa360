import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET: Seleciona todos
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET: Seleciona por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM Users WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere novo registro
router.post('/', async (req, res) => {
  try {
    const { name, email, wallet, account_status } = req.body;
    const result = await query(
      `INSERT INTO Users (name, email, wallet, account_status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, wallet || 0, account_status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza registro por ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, wallet, account_status } = req.body;
    const result = await query(
      `UPDATE Users SET name = $1, email = $2, wallet = $3, account_status = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, email, wallet, account_status, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Users WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;