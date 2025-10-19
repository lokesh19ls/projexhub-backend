import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';

const router = Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// User Management
router.get('/users', adminController.getAllUsers);
router.post('/users/:userId/verify', adminController.verifyUser);
router.post('/users/:userId/deactivate', adminController.deactivateUser);

// Project Management
router.get('/projects', adminController.getAllProjects);

// Dispute Management
router.get('/disputes', adminController.getAllDisputes);
router.post('/disputes/:disputeId/resolve', adminController.resolveDispute);

// Analytics
router.get('/dashboard/stats', adminController.getDashboardStats);

// Payments
router.get('/payments', adminController.getAllPayments);

export default router;

