// filepath: /backend/src/models/finance.ts
import { Pool } from 'pg';
import { FinanceEntry } from '../types';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create a new finance entry
export const createFinanceEntry = async (entry: FinanceEntry) => {
    const { userId, financeCcId, financeCategoryId, financePayerId, startDate, paymentDay, description, installmentsCount, isRecurring } = entry;
    const result = await pool.query(
        `INSERT INTO Finance_Entries (user_id, finance_cc_id, finance_category_id, finance_payer_id, start_date, payment_day, description, installments_count, is_recurring)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [userId, financeCcId, financeCategoryId, financePayerId, startDate, paymentDay, description, installmentsCount, isRecurring]
    );
    return result.rows[0];
};

// Get all finance entries
export const getAllFinanceEntries = async () => {
    const result = await pool.query(`SELECT * FROM Finance_Entries`);
    return result.rows;
};

// Get a finance entry by ID
export const getFinanceEntryById = async (id: number) => {
    const result = await pool.query(`SELECT * FROM Finance_Entries WHERE id = $1`, [id]);
    return result.rows[0];
};

// Update a finance entry
export const updateFinanceEntry = async (id: number, entry: Partial<FinanceEntry>) => {
    const { userId, financeCcId, financeCategoryId, financePayerId, startDate, paymentDay, description, installmentsCount, isRecurring } = entry;
    const result = await pool.query(
        `UPDATE Finance_Entries SET user_id = COALESCE($1, user_id), finance_cc_id = COALESCE($2, finance_cc_id), 
         finance_category_id = COALESCE($3, finance_category_id), finance_payer_id = COALESCE($4, finance_payer_id), 
         start_date = COALESCE($5, start_date), payment_day = COALESCE($6, payment_day), 
         description = COALESCE($7, description), installments_count = COALESCE($8, installments_count), 
         is_recurring = COALESCE($9, is_recurring) WHERE id = $10 RETURNING *`,
        [userId, financeCcId, financeCategoryId, financePayerId, startDate, paymentDay, description, installmentsCount, isRecurring, id]
    );
    return result.rows[0];
};

// Delete a finance entry
export const deleteFinanceEntry = async (id: number) => {
    await pool.query(`DELETE FROM Finance_Entries WHERE id = $1`, [id]);
};