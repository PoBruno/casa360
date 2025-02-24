import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';
import { FinanceFrequency } from '../types/finance';

export const getFinanceFrequencies = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params;
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('SELECT * FROM finance_frequency ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar frequências', details: error });
  }
};

export const getFinanceFrequencyById = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('SELECT * FROM finance_frequency WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Frequência não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar frequência', details: error });
  }
};

export const createFinanceFrequency = async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const { name, days_interval }: FinanceFrequency = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'INSERT INTO finance_frequency (name, days_interval) VALUES ($1, $2) RETURNING *',
      [name, days_interval]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar frequência', details: error });
  }
};

export const updateFinanceFrequency = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { name, days_interval }: FinanceFrequency = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'UPDATE finance_frequency SET name = $1, days_interval = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, days_interval, id]
    );

    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Frequência não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar frequência', details: error });
  }
};

export const deleteFinanceFrequency = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('DELETE FROM finance_frequency WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Frequência não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar frequência', details: error });
  }
};