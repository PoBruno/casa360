import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createHouse, getUserHouses } from '../controllers/houseController';

const router = Router();

// Create a new house
router.post('/', authenticate, createHouse);

// Get all houses for the authenticated user
router.get('/my-houses', authenticate, getUserHouses);

export default router;
