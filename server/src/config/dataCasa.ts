import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const dataCasaPool = new Pool({
    host: process.env.DATA_CASA_HOST,
    user: process.env.DATA_CASA_USER,
    password: process.env.DATA_CASA_PASSWORD,
    database: process.env.DATA_CASA_NAME,
    port: Number(process.env.DATA_CASA_PORT),
});