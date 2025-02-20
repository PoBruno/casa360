import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, secretKey, async (err, decoded) => {
        if (err || !decoded || typeof decoded === 'string') {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }

        const payload = decoded as TokenPayload;
        const userId = payload.id;

        const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(403).json({ message: 'User not found' });
        }

        // Set req.user based on our custom declaration
        req.user = result.rows[0];
        next();
    });
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ensure req.user is present and has a role before calling includes
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};