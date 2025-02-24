import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

export const getFinanceCurrencies = async (req: Request, res: Response) => {
  try {
    const { house_id } = req.params;
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('SELECT * FROM finance_currency ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar moedas/taxas de câmbio', details: error });
  }
};

export const getFinanceCurrencyById = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('SELECT * FROM finance_currency WHERE id = $1', [id]);
    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Moeda não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar moeda', details: error });
  }
};

export const createFinanceCurrency = async (req: Request, res: Response) => {
  const { house_id } = req.params;
  const { name, symbol, exchange_rate } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'INSERT INTO finance_currency (name, symbol, exchange_rate) VALUES ($1, $2, $3) RETURNING *',
      [name, symbol, exchange_rate]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar moeda', details: error });
  }
};

export const updateFinanceCurrency = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { name, symbol, exchange_rate } = req.body;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'UPDATE finance_currency SET name = $1, symbol = $2, exchange_rate = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
      [name, symbol, exchange_rate, id]
    );

    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Moeda não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar moeda', details: error });
  }
};

export const deleteFinanceCurrency = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query('DELETE FROM finance_currency WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Moeda não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar moeda', details: error });
  }
};