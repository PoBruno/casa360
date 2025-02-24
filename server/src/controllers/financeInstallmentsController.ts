import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

export const getFinanceInstallments = async (req: Request, res: Response) => {
  const { house_id } = req.params;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'SELECT * FROM Finance_Installments ORDER BY due_date'
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar parcelas', details: error });
  }
};

export const getFinanceInstallmentById = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'SELECT * FROM Finance_Installments WHERE id = $1',
      [id]
    );

    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Parcela não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar parcela', details: error });
  }
};

export const updateInstallmentStatus = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { status } = req.body;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'UPDATE Finance_Installments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Parcela não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status da parcela', details: error });
  }
};

export const updateFinanceInstallment = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { finance_entries_id, installment_number, due_date, amount } = req.body;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      `UPDATE Finance_Installments SET 
        finance_entries_id = $1,
        installment_number = $2,
        due_date = $3,
        amount = $4,
        updated_at = NOW()
      WHERE id = $5 RETURNING *`,
      [finance_entries_id, installment_number, due_date, amount, id]
    );

    if (result.rows.length) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Parcela não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar parcela', details: error });
  }
};

export const deleteFinanceInstallment = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'DELETE FROM Finance_Installments WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length) {
      res.status(204).send();
    } else {
      res.status(404).json({ message: 'Parcela não encontrada' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir parcela', details: error });
  }
};
