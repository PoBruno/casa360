import { Router } from 'express';
import usersRouter from './user';
import financeFrequencyRouter from './financeFrequency';
import financeCCRouter from './financeCC';
import financeCategoryRouter from './financeCategory';
import financePayerRouter from './financePayer';
import financePayerUsersRouter from './financePayerUsers';
import financeCurrencyRouter from './financeCurrency';
import financeEntriesRouter from './financeEntries';
import financeInstallmentsRouter from './financeInstallments';
import transactionsRouter from './transactions';
import rfpRouter from './rfp';
import suppliersRouter from './suppliers';
import productsRouter from './products';
import walletHistoryRouter from './walletHistory';

const router = Router();

router.use('/users', usersRouter);
router.use('/walletHistory', walletHistoryRouter);
router.use('/financeFrequency', financeFrequencyRouter);
router.use('/financeCC', financeCCRouter);
router.use('/financeCategory', financeCategoryRouter);
router.use('/financePayer', financePayerRouter);
router.use('/financePayerUsers', financePayerUsersRouter);
router.use('/financeCurrency', financeCurrencyRouter);
router.use('/financeEntries', financeEntriesRouter);
router.use('/financeInstallments', financeInstallmentsRouter);
router.use('/transactions', transactionsRouter);
router.use('/rfp', rfpRouter);
router.use('/suppliers', suppliersRouter);
router.use('/products', productsRouter);

export default router;
