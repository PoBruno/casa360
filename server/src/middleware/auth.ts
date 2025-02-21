import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Pool } from 'pg';

const secretKey = process.env.JWT_SECRET || 'your_secret_key';
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
});

// Type helper for our expected token payload
interface TokenPayload {
    id: string;
    email: string;
}

interface CustomRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

interface CustomJwtPayload extends JwtPayload {
  id: string;
  email: string;
  role?: string;
}

export const authenticate = async (req: CustomRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Remove 'Bearer ' do token se existir
    const token = authHeader.replace('Bearer ', '');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as CustomJwtPayload;
    
    // Garante que o payload tem os campos necessários
    if (!decoded.id || !decoded.email) {
      throw new Error('Invalid token payload');
    }
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const authorize = (roles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    // Ensure req.user is present and has a role before calling includes
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};