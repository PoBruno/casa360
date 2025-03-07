import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';
import {  
  getFinanceInstallments,
  getFinanceInstallmentById,
  updateInstallmentStatus,
  updateFinanceInstallment,
  deleteFinanceInstallment,
  patchFinanceInstallment
} from '../controllers/financeInstallmentsController';

const router = Router({ mergeParams: true });
const houseMiddleware = [authenticate, validateHouseAccess];

router.get('/', houseMiddleware, getFinanceInstallments);
router.get('/:id', houseMiddleware, getFinanceInstallmentById);
router.put('/:id/status', houseMiddleware, updateInstallmentStatus);
router.put('/:id', houseMiddleware, updateFinanceInstallment);
router.patch('/:id', houseMiddleware, patchFinanceInstallment);
router.delete('/:id', houseMiddleware, deleteFinanceInstallment);

export default router;
