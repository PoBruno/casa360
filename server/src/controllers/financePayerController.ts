import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

export const getFinancePayers = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params;
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('SELECT * FROM finance_payer ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pagadores', details: error });
  }
};

export const getFinancePayerById = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('SELECT * FROM finance_payer WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Pagador não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pagador', details: error });
  }
};

export const createFinancePayer = async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const { name } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'INSERT INTO finance_payer (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar pagador', details: error });
  }
};

export const updateFinancePayer = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { name } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'UPDATE finance_payer SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Pagador não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar pagador', details: error });
  }
};

export const deleteFinancePayer = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('DELETE FROM finance_payer WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Pagador não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar pagador', details: error });
  }
};