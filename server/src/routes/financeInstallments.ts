import { Router, Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

const router = Router({ mergeParams: true });

// GET: Lista todas as parcelas
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Finance_Installments');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET: Busca parcela por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM Finance_Installments WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Finance Installment not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere uma nova parcela
router.post('/', async (req, res) => {
  try {
    const { finance_entries_id, installment_number, due_date, amount, status } = req.body;
    const result = await query(
      `INSERT INTO Finance_Installments 
       (finance_entries_id, installment_number, due_date, amount, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [finance_entries_id, installment_number, due_date, amount, status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza parcela por ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { finance_entries_id, installment_number, due_date, amount, status } = req.body;
    const result = await query(
      `UPDATE Finance_Installments
       SET finance_entries_id = $1, installment_number = $2, due_date = $3, amount = $4, status = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [finance_entries_id, installment_number, due_date, amount, status, id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Finance Installment not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove parcela por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Finance_Installments WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;