import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';
import {
  getFinanceEntries,
  getFinanceEntryById,
  createFinanceEntry,
  updateFinanceEntry,
  deleteFinanceEntry
} from '../controllers/financeEntriesController';

const router = Router({ mergeParams: true });
const houseMiddleware = [authenticate, validateHouseAccess];

router.get('/', houseMiddleware, getFinanceEntries);
router.get('/:id', houseMiddleware, getFinanceEntryById);
router.post('/', houseMiddleware, createFinanceEntry);
router.put('/:id', houseMiddleware, updateFinanceEntry);
router.delete('/:id', houseMiddleware, deleteFinanceEntry);

export default router;