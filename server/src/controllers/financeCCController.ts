import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

export const getFinanceCCs = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params;
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('SELECT * FROM finance_cc ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar centros de custo', details: error });
  }
};

export const getFinanceCCById = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('SELECT * FROM finance_cc WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Centro de custo não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar centro de custo', details: error });
  }
};

export const createFinanceCC = async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const { name, description } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'INSERT INTO finance_cc (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar centro de custo', details: error });
  }
};

export const updateFinanceCC = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { name, description } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'UPDATE finance_cc SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [name, description, id]
    );

    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Centro de custo não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar centro de custo', details: error });
  }
};

export const deleteFinanceCC = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('DELETE FROM finance_cc WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Centro de custo não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar centro de custo', details: error });
  }
};