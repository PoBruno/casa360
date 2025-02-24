import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';
import { updateInstallmentStatus } from '../controllers/financeInstallmentsController';

const router = Router({ mergeParams: true });
const houseMiddleware = [authenticate, validateHouseAccess];

router.put('/:id/status', houseMiddleware, updateInstallmentStatus);

export default router;
