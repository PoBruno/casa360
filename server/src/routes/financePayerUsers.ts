import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET: Lista todas as associações pagador/usuário
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Finance_Payer_Users');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET: Retorna a associação por pagador e usuário (chave composta)
router.get('/:finance_payer_id/:user_id', async (req, res) => {
  try {
    const { finance_payer_id, user_id } = req.params;
    const result = await query(
      'SELECT * FROM Finance_Payer_Users WHERE finance_payer_id = $1 AND user_id = $2',
      [finance_payer_id, user_id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere uma nova associação pagador/usuário
router.post('/', async (req, res) => {
  try {
    const { finance_payer_id, user_id, percentage } = req.body;
    const result = await query(
      `INSERT INTO Finance_Payer_Users (finance_payer_id, user_id, percentage)
       VALUES ($1, $2, $3) RETURNING *`,
      [finance_payer_id, user_id, percentage]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza os percentuais da associação (chave composta)
router.put('/:finance_payer_id/:user_id', async (req, res) => {
  try {
    const { finance_payer_id, user_id } = req.params;
    const { percentage } = req.body;
    const result = await query(
      `UPDATE Finance_Payer_Users
       SET percentage = $1
       WHERE finance_payer_id = $2 AND user_id = $3 RETURNING *`,
      [percentage, finance_payer_id, user_id]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Record not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove uma associação por chave composta
router.delete('/:finance_payer_id/:user_id', async (req, res) => {
  try {
    const { finance_payer_id, user_id } = req.params;
    await query(
      'DELETE FROM Finance_Payer_Users WHERE finance_payer_id = $1 AND user_id = $2',
      [finance_payer_id, user_id]
    );
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;