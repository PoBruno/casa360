import { Request, Response } from 'express';
import { query } from '../services/database';

export const getHousesByUser = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  try {
    const result = await query('SELECT * FROM houses WHERE user_id = $1', [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar casas', error });
  }
};