import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);
router.post('/send-otp', validate(schemas.sendOTP), authController.sendOTP);
router.post('/verify-otp', validate(schemas.verifyOTP), authController.verifyOTP);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);

export default router;

