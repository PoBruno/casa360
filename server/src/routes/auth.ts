import { Router, Request } from 'express';
import { login, register } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Define custom interface extending Request
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

// Route for user registration
router.post('/register', register);

// Route for user login
router.post('/login', login);

// Example of a protected route
router.get('/profile', authenticate, (req: AuthenticatedRequest, res) => {
    res.status(200).json({ message: 'This is a protected route', user: req.user });
});

export default router;