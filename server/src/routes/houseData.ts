import { Router } from 'express';
import financeCategoryRouter from './financeCategory';
import financeCCRouter from './financeCC';
import financeFrequencyRouter from './financeFrequency';
import financePayerRouter from './financePayer';
import financePayerUsersRouter from './financePayerUsers';
import financeCurrencyRouter from './financeCurrency';
import financeEntriesRouter from './financeEntries';
import financeInstallmentsRouter from './financeInstallments';

const router = Router({ mergeParams: true });

// Rotas data-casa
router.use('/finance-category', financeCategoryRouter);
router.use('/finance-cc', financeCCRouter);
router.use('/finance-frequency', financeFrequencyRouter);
router.use('/finance-payer', financePayerRouter);
router.use('/finance-payer-users', financePayerUsersRouter);
router.use('/finance-currency', financeCurrencyRouter);
router.use('/finance-entries', financeEntriesRouter);
router.use('/finance-installments', financeInstallmentsRouter);

export default router;
