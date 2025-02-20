import { Router } from 'express';
import {
    getAllFinanceRecords,
    getFinanceRecordById,
    createFinanceRecord,
    updateFinanceRecord,
    deleteFinanceRecord
} from '../controllers/financeController';

const router = Router();

// Get all finance records
router.get('/', getAllFinanceRecords);

// Get a finance record by ID
router.get('/:id', getFinanceRecordById);

// Create a new finance record
router.post('/', createFinanceRecord);

// Update a finance record by ID
router.put('/:id', updateFinanceRecord);

// Delete a finance record by ID
router.delete('/:id', deleteFinanceRecord);

export default router;