import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';

// Importações das rotas
import usersRouter from './user';
//import financeFrequencyRouter from './financeFrequency';
//import financeCCRouter from './financeCC';
//import financeCategoryRouter from './financeCategory';
//import financePayerRouter from './financePayer';
//import financePayerUsersRouter from './financePayerUsers';
//import financeEntriesRouter from './financeEntries';
//import financeInstallmentsRouter from './financeInstallments';

import financeCurrencyRouter from './financeCurrency';

const router = Router();

// Middleware para autenticação e validação de acesso à casa
const houseMiddleware = [authenticate, validateHouseAccess];

// Rotas públicas, ex: /api/auth, etc.
router.use('/users', usersRouter);

// Agrupa todas as rotas relacionadas à casa sob /house/:house_id
router.use('/house/:house_id', houseMiddleware, (req: Request, res: Response, next: NextFunction) => {
  // Middleware para rotas da casa
  next();
});

// Monta as rotas protegidas
//router.use('/house/:house_id/finance-frequency', financeFrequencyRouter);
//router.use('/house/:house_id/finance-cc', financeCCRouter);
//router.use('/house/:house_id/finance-category', financeCategoryRouter);
//router.use('/house/:house_id/finance-payer', financePayerRouter);
//router.use('/house/:house_id/finance-payer-users', financePayerUsersRouter);
//router.use('/house/:house_id/finance-entries', financeEntriesRouter);
//router.use('/house/:house_id/finance-installments', financeInstallmentsRouter);

router.use('/house/:house_id/finance-currency', financeCurrencyRouter);

export default router;