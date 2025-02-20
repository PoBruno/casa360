import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET TUDO: Lista todas as entradas do histórico
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM User_Wallet_History');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET POR ID: Retorna um registro específico do histórico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM User_Wallet_History WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Registro não encontrado' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere um novo registro no histórico
router.post('/', async (req, res) => {
  try {
    const { user_id, change_amount, resulting_balance, change_date } = req.body;
    const result = await query(
      `INSERT INTO User_Wallet_History (user_id, change_amount, resulting_balance, change_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [user_id, change_amount, resulting_balance, change_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza um registro do histórico
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, change_amount, resulting_balance, change_date } = req.body;
    const result = await query(
      `UPDATE User_Wallet_History 
       SET user_id = $1, change_amount = $2, resulting_balance = $3, change_date = $4
       WHERE id = $5 RETURNING *`,
      [user_id, change_amount, resulting_balance, change_date, id]
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

// DELETE: Remove um registro do histórico
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM User_Wallet_History WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;