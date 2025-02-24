import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';
import { Transaction } from '../types/finance';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params;
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('SELECT * FROM transactions ORDER BY transaction_date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transações', details: error });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('SELECT * FROM transactions WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Transação não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transação', details: error });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const transaction: Transaction = req.body;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      `INSERT INTO transactions (
        user_id, finance_installments_id, transaction_date,
        amount, is_income, description, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        transaction.user_id, transaction.finance_installments_id,
        transaction.transaction_date || new Date(),
        transaction.amount, transaction.is_income,
        transaction.description, transaction.status || 'pending'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar transação', details: error });
  }
};