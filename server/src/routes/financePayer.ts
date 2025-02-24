import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';
import {
  getFinancePayers,
  getFinancePayerById,
  createFinancePayer,
  updateFinancePayer,
  deleteFinancePayer
} from '../controllers/financePayerController';

const router = Router({ mergeParams: true });

const houseMiddleware = [authenticate, validateHouseAccess];

router.get('/', houseMiddleware, getFinancePayers);
router.get('/:id', houseMiddleware, getFinancePayerById);
router.post('/', houseMiddleware, createFinancePayer);
router.put('/:id', houseMiddleware, updateFinancePayer);
router.delete('/:id', houseMiddleware, deleteFinancePayer);

export default router;