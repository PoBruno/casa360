import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

export const getFinancePayerUsers = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params;
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(`
      SELECT fpu.*, fp.name as payer_name, u.name as user_name 
      FROM finance_payer_users fpu
      JOIN finance_payer fp ON fp.id = fpu.finance_payer_id
      JOIN users u ON u.id = fpu.user_id
      ORDER BY fp.name, u.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários dos pagadores', details: error });
  }
};

export const getFinancePayerUsersByPayerId = async (req: Request, res: Response) => {
  const { house_id, payer_id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(`
      SELECT fpu.*, u.name as user_name 
      FROM finance_payer_users fpu
      JOIN users u ON u.id = fpu.user_id
      WHERE fpu.finance_payer_id = $1
    `, [payer_id]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários do pagador', details: error });
  }
};

export const createFinancePayerUser = async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const { finance_payer_id, user_id, percentage } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'INSERT INTO finance_payer_users (finance_payer_id, user_id, percentage) VALUES ($1, $2, $3) RETURNING *',
      [finance_payer_id, user_id, percentage]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar relação pagador-usuário', details: error });
  }
};

export const updateFinancePayerUser = async (req: Request, res: Response) => {
  const { house_id, payer_id, user_id } = req.params;
  const { percentage } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'UPDATE finance_payer_users SET percentage = $1 WHERE finance_payer_id = $2 AND user_id = $3 RETURNING *',
      [percentage, payer_id, user_id]
    );

    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Relação pagador-usuário não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar relação pagador-usuário', details: error });
  }
};

export const deleteFinancePayerUser = async (req: Request, res: Response) => {
  const { house_id, payer_id, user_id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'DELETE FROM finance_payer_users WHERE finance_payer_id = $1 AND user_id = $2 RETURNING *',
      [payer_id, user_id]
    );
    
    if (result.rows.length) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Relação pagador-usuário não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar relação pagador-usuário', details: error });
  }
};