import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: '24h'
  },
  bcrypt: {
    saltRounds: 10
  },
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }
};

export const primaryPool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT)
});

export const dataCasaPool = new Pool({
  host: process.env.DATA_CASA_HOST,
  user: process.env.DATA_CASA_USER,
  password: process.env.DATA_CASA_PASSWORD,
  database: process.env.DATA_CASA_NAME,
  port: Number(process.env.DATA_CASA_PORT)
});

export const query = (text: string, params?: any[]) => {
    return primaryPool.query(text, params);
};

export default {
    query,
};