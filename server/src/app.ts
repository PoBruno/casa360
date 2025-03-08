/// <reference path="./types/express/custom.d.ts" />

import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';
import errorHandler from './middleware/error';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/auth';
import houseRoutes from './routes/house';
import financeCurrencyRoutes from './routes/financeCurrency';
import kanbanBucketsRoutes from './routes/kanbanBuckets';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Monta primeiro as rotas de autenticação para evitar conflito
app.use('/api/auth', authRoutes);
// Em seguida, as demais rotas
app.use('/api/houses', houseRoutes);
app.use('/api/house/:house_id/finance-currency', financeCurrencyRoutes);
app.use('/api/house/:house_id/kanban-buckets', kanbanBucketsRoutes);
app.use('/api', routes);

app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});

export default app;
