import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT)
};

export const primaryPool = new Pool(config);

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

export { config };

export default {
  query,
  config,
  primaryPool,
  dataCasaPool
};
