import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);

export default router;

