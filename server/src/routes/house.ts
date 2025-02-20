import { Router } from 'express';
import { registerHouse, getHousesByUser } from '../controllers/houseController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, registerHouse);
router.get('/:userId', authenticate, getHousesByUser);

export default router;
