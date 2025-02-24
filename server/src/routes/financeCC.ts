import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';
import {
  getFinanceCCs,
  getFinanceCCById,
  createFinanceCC,
  updateFinanceCC,
  deleteFinanceCC
} from '../controllers/financeCCController';

const router = Router({ mergeParams: true });

const houseMiddleware = [authenticate, validateHouseAccess];

router.get('/', houseMiddleware, getFinanceCCs);
router.get('/:id', houseMiddleware, getFinanceCCById);
router.post('/', houseMiddleware, createFinanceCC);
router.put('/:id', houseMiddleware, updateFinanceCC);
router.delete('/:id', houseMiddleware, deleteFinanceCC);

export default router;