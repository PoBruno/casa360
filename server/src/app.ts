/// <reference path="./types/express/custom.d.ts" />

import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';
import errorHandler from './middleware/error';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Monta primeiro as rotas de autenticação para evitar conflito
app.use('/api/auth', authRoutes);
// Em seguida, as demais rotas
app.use('/api', routes);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;