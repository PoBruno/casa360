import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET || 'JWT_SECRET';

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
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, secretKey) as CustomJwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};
