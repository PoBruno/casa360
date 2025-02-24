import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';
import {
  getTransactions,
  getTransactionById,
  createTransaction
} from '../controllers/transactionsController';

const router = Router({ mergeParams: true });
const houseMiddleware = [authenticate, validateHouseAccess];

router.get('/', houseMiddleware, getTransactions);
router.get('/:id', houseMiddleware, getTransactionById);
router.post('/', houseMiddleware, createTransaction);

export default router;
