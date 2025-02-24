import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';
import { createFinanceCurrency, getFinanceCurrencies, getFinanceCurrencyById, updateFinanceCurrency, deleteFinanceCurrency } from '../controllers/financeCurrencyController';

const router = Router({ mergeParams: true });

// Middleware para autenticação e validação de acesso à casa
const houseMiddleware = [authenticate, validateHouseAccess];

// GET: Lista todas as moedas/taxas de câmbio
router.get('/', houseMiddleware, getFinanceCurrencies);

// GET: Retorna uma moeda por ID
router.get('/:id', houseMiddleware, getFinanceCurrencyById);

// POST: Insere uma nova moeda
router.post('/', houseMiddleware, createFinanceCurrency);

// PUT: Atualiza uma moeda por ID
router.put('/:id', houseMiddleware, updateFinanceCurrency);

// DELETE: Remove uma moeda por ID
router.delete('/:id', houseMiddleware, deleteFinanceCurrency);

export default router;