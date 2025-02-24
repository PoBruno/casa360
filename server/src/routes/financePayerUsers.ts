import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';
import {
  getFinancePayerUsers,
  getFinancePayerUsersByPayerId,
  createFinancePayerUser,
  updateFinancePayerUser,
  deleteFinancePayerUser
} from '../controllers/financePayerUsersController';

const router = Router({ mergeParams: true });

const houseMiddleware = [authenticate, validateHouseAccess];

router.get('/', houseMiddleware, getFinancePayerUsers);
router.get('/payer/:payer_id', houseMiddleware, getFinancePayerUsersByPayerId);
router.post('/', houseMiddleware, createFinancePayerUser);
router.put('/:payer_id/user/:user_id', houseMiddleware, updateFinancePayerUser);
router.delete('/:payer_id/user/:user_id', houseMiddleware, deleteFinancePayerUser);

export default router;