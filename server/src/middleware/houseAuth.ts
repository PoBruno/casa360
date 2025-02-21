import { Request, Response, NextFunction } from 'express';
import DatabaseManager from '../services/databaseManager';

interface CustomRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const validateHouseAccess = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { house_id } = req.params;
    if (!req.user?.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const dbManager = DatabaseManager.getInstance();
    const userPool = await dbManager.getUserPool();

    const result = await userPool.query(
      'SELECT * FROM houses WHERE id = $1 AND user_id = $2',
      [house_id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this house' });
    }

    next();
  } catch (error) {
    console.error('Error validating house access:', error);
    res.status(500).json({ error: 'Error validating house access' });
  }
};
