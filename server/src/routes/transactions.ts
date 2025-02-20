import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET: Lista todas as transações
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Transactions');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET: Busca transação por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM Transactions WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere uma nova transação
router.post('/', async (req, res) => {
  try {
    const { user_id, finance_installments_id, transaction_date, amount, is_income, description, status } = req.body;
    const result = await query(
      `INSERT INTO Transactions
       (user_id, finance_installments_id, transaction_date, amount, is_income, description, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, finance_installments_id, transaction_date || new Date(), amount, is_income, description, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza transação por ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, finance_installments_id, transaction_date, amount, is_income, description, status } = req.body;
    const result = await query(
      `UPDATE Transactions
       SET user_id = $1, finance_installments_id = $2, transaction_date = $3, amount = $4,
           is_income = $5, description = $6, status = $7, updated_at = NOW()
       WHERE id = $8 RETURNING *`,
      [user_id, finance_installments_id, transaction_date, amount, is_income, description, status, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Transaction not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove transação por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Transactions WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;