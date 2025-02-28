import { Request, Response } from 'express';

export const login = async (req: Request, res: Response) => {
    // TODO: Implement login logic
    res.status(501).json({ message: 'Not implemented yet' });
};

export const register = async (req: Request, res: Response) => {
    // TODO: Implement register logic
    res.status(501).json({ message: 'Not implemented yet' });
};import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';

// Importações das rotas
import usersRouter from './user';
import houseRouter from './house';
import financeFrequencyRouter from './financeFrequency';
import financeCCRouter from './financeCC';
import financeCategoryRouter from './financeCategory';
import financePayerRouter from './financePayer';
import financePayerUsersRouter from './financePayerUsers';
import financeEntriesRouter from './financeEntries';
import financeInstallmentsRouter from './financeInstallments';
import transactionsRouter from './transactions';
import financeCurrencyRouter from './financeCurrency';
import financeUsersRouter from './financeUsers';

const router = Router();

// Middleware para autenticação e validação de acesso à casa
const houseMiddleware = [authenticate, validateHouseAccess];

// Rotas públicas, ex: /api/auth, etc.
router.use('/users', usersRouter);
router.use('/houses', houseRouter);

// Agrupa todas as rotas relacionadas à casa sob /house/:house_id
router.use('/house/:house_id', houseMiddleware, (req: Request, res: Response, next: NextFunction) => {
  // Middleware para rotas da casa
  next();
});

// Monta as rotas protegidas
router.use('/house/:house_id/finance-frequency', financeFrequencyRouter);
router.use('/house/:house_id/finance-cc', financeCCRouter);
router.use('/house/:house_id/finance-category', financeCategoryRouter);
router.use('/house/:house_id/finance-payer', financePayerRouter);
router.use('/house/:house_id/finance-payer-users', financePayerUsersRouter);
router.use('/house/:house_id/finance-entries', financeEntriesRouter);
router.use('/house/:house_id/finance-installments', financeInstallmentsRouter);
router.use('/house/:house_id/finance-transactions', transactionsRouter);
router.use('/house/:house_id/finance-currency', financeCurrencyRouter);
router.use('/house/:house_id/finance-users', financeUsersRouter);
export default router;
