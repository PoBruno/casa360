import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';
import {
    getFinanceUsers,
    getFinanceUsersById,
    createFinanceUsers,
    updateFinanceUsers,
    deleteFinanceUsers
} from '../controllers/financeUsersController';

const router = Router({ mergeParams: true });
const houseMiddleware = [authenticate, validateHouseAccess];

router.get('/', houseMiddleware, getFinanceUsers);
router.get('/:id', houseMiddleware, getFinanceUsersById);
router.post('/', houseMiddleware, createFinanceUsers);
router.put('/:id', houseMiddleware, updateFinanceUsers);
router.delete('/:id', houseMiddleware, deleteFinanceUsers);

export default router;
