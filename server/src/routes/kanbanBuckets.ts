import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateHouseAccess } from '../middleware/houseAuth';
import {
  getKanbanBuckets,
  getKanbanBucketById,
  createKanbanBucket,
  updateKanbanBucket,
  deleteKanbanBucket
} from '../controllers/kanbanBucketsController';

const router = Router({ mergeParams: true });

// Middleware para autenticação e validação de acesso à casa
const houseMiddleware = [authenticate, validateHouseAccess];

// GET: Lista todos os buckets do kanban
router.get('/', houseMiddleware, getKanbanBuckets);

// GET: Retorna um bucket por ID
router.get('/:id', houseMiddleware, getKanbanBucketById);

// POST: Cria um novo bucket
router.post('/', houseMiddleware, createKanbanBucket);

// PUT: Atualiza um bucket por ID
router.put('/:id', houseMiddleware, updateKanbanBucket);

// DELETE: Remove um bucket por ID
router.delete('/:id', houseMiddleware, deleteKanbanBucket);

export default router;