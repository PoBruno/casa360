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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Usar o pool da instância data-user para verificar permissões
    const dbManager = DatabaseManager.getInstance();
    const userPool = await dbManager.getUserPool();

    // Consultar a tabela house_users para verificar as permissões
    const result = await userPool.query(
      `SELECT hu.role 
       FROM house_users hu 
       WHERE hu.house_id = $1 
       AND hu.user_id = $2`,
      [house_id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied to this house' });
    }

    // Adicionar a role do usuário ao request para uso posterior
    const userRole = result.rows[0].role;
    if (!req.user) req.user = { id: userId, email: '', role: userRole };
    else req.user.role = userRole;

    // Por enquanto, apenas 'owner' tem acesso
    if (userRole !== 'owner') {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        required: 'owner',
        current: userRole 
      });
    }

    next();
  } catch (error) {
    console.error('Error validating house access:', error);
    res.status(500).json({ error: 'Error validating house access' });
  }
};
