import { Router } from 'express';
import { query } from '../services/database';

const router = Router();

// GET: Lista todas as entradas financeiras
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM Finance_Entries');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json(error);
  }
});

// GET: Retorna uma entrada financeira por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM Finance_Entries WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Finance_Entries not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// POST: Insere uma nova entrada financeira
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      finance_cc_id,
      finance_category_id,
      finance_payer_id,
      finance_currency_id,
      finance_frequency_id,
      is_income,
      amount,
      start_date,
      end_date,
      description,
      installments_count,
      is_fixed,
      is_recurring,
      payment_day
    } = req.body;
    const result = await query(
      `INSERT INTO Finance_Entries (
         user_id,
         finance_cc_id,
         finance_category_id,
         finance_payer_id,
         finance_currency_id,
         finance_frequency_id,
         is_income,
         amount,
         start_date,
         end_date,
         description,
         installments_count,
         is_fixed,
         is_recurring,
         payment_day
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        user_id,
        finance_cc_id,
        finance_category_id,
        finance_payer_id,
        finance_currency_id,
        finance_frequency_id,
        is_income,
        amount,
        start_date,
        end_date,
        description,
        installments_count,
        is_fixed,
        is_recurring,
        payment_day
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json(error);
  }
});

// PUT: Atualiza uma entrada financeira por ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      user_id,
      finance_cc_id,
      finance_category_id,
      finance_payer_id,
      finance_currency_id,
      finance_frequency_id,
      is_income,
      amount,
      start_date,
      end_date,
      description,
      installments_count,
      is_fixed,
      is_recurring,
      payment_day
    } = req.body;
    const result = await query(
      `UPDATE Finance_Entries
       SET user_id = $1,
           finance_cc_id = $2,
           finance_category_id = $3,
           finance_payer_id = $4,
           finance_currency_id = $5,
           finance_frequency_id = $6,
           is_income = $7,
           amount = $8,
           start_date = $9,
           end_date = $10,
           description = $11,
           installments_count = $12,
           is_fixed = $13,
           is_recurring = $14,
           payment_day = $15,
           updated_at = NOW()
       WHERE id = $16
       RETURNING *`,
      [
        user_id,
        finance_cc_id,
        finance_category_id,
        finance_payer_id,
        finance_currency_id,
        finance_frequency_id,
        is_income,
        amount,
        start_date,
        end_date,
        description,
        installments_count,
        is_fixed,
        is_recurring,
        payment_day,
        id
      ]
    );
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Finance_Entries not found' });
    }
  } catch (error) {
    res.status(500).json(error);
  }
});

// DELETE: Remove uma entrada financeira por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM Finance_Entries WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json(error);
  }
});

export default router;