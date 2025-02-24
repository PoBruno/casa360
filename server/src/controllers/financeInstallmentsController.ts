import { Request, Response } from 'express';
import DatabaseManager from '../services/databaseManager';

export const updateInstallmentStatus = async (req: Request, res: Response) => {
  const { house_id, id } = req.params;
  const { status } = req.body;
  
  try {
    const dbManager = DatabaseManager.getInstance();
    const housePool = await dbManager.getHousePool(house_id);

    const result = await housePool.query(
      'UPDATE finance_installments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
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