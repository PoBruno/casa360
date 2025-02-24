import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';
import {
  getFinanceFrequencies,
  getFinanceFrequencyById,
  createFinanceFrequency,
  updateFinanceFrequency,
  deleteFinanceFrequency
} from '../controllers/financeFrequencyController';

const router = Router({ mergeParams: true });

// Middleware para autenticação e validação de acesso à casa
const houseMiddleware = [authenticate, validateHouseAccess];

// GET: Lista todas as frequências
router.get('/', houseMiddleware, getFinanceFrequencies);

// GET: Retorna uma frequência por ID
router.get('/:id', houseMiddleware, getFinanceFrequencyById);

// POST: Cria uma nova frequência
router.post('/', houseMiddleware, createFinanceFrequency);

// PUT: Atualiza uma frequência existente
router.put('/:id', houseMiddleware, updateFinanceFrequency);

// DELETE: Remove uma frequência
router.delete('/:id', houseMiddleware, deleteFinanceFrequency);

export default router;