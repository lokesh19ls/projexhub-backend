import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { UserRole } from '../models/User';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.post(
  '/project/:projectId/order',
  authorize(UserRole.STUDENT, UserRole.ADMIN),
  validate(schemas.createPayment),
  paymentController.createPaymentOrder
);

router.post('/verify', paymentController.verifyPayment);

// Common routes
router.get('/history', paymentController.getPaymentHistory);

// Developer routes
router.get(
  '/earnings',
  authorize(UserRole.DEVELOPER, UserRole.ADMIN),
  paymentController.getEarnings
);

export default router;

