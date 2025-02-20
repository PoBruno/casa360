import { Router } from 'express';
import { login, register } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Route for user registration
router.post('/register', register);

// Route for user login
router.post('/login', login);

// Example of a protected route
router.get('/profile', authenticate, (req, res) => {
    res.status(200).json({ message: 'This is a protected route', user: req.user });
});

export default router;