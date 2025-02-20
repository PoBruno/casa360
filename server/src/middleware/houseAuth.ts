import { Request, Response, NextFunction } from 'express';
import DatabaseManager from '../services/databaseManager';

export const validateHouseAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { houseId } = req.params;
    const userId = req.user.id;

    const dbManager = DatabaseManager.getInstance();
    const userPool = await dbManager.getUserPool();

    const result = await userPool.query(
      'SELECT * FROM houses WHERE id = $1 AND user_id = $2',
      [houseId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this house' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Error validating house access' });
  }
};
