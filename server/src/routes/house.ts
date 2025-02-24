import { Router, Request, Response } from 'express';
import { createHouse, getHousesByUser } from '../controllers/houseController';
import { authenticate } from '../middleware/auth';

const router = Router({ mergeParams: true });

// Rota para criar uma nova casa
router.post('/', authenticate, createHouse);

// Rota para obter casas por usuário
router.get('/', authenticate, getHousesByUser);

export default router;
