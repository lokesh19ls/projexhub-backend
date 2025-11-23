import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '../models/User';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// Admin login (no authentication required)
router.post('/login', validate(schemas.adminLogin), adminController.login);

// All other routes require admin authentication
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// User Management
router.get('/users', adminController.listUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.post('/users/:userId/verify', adminController.verifyUser);
router.post('/users/:userId/deactivate', adminController.deactivateUser);

// Project Management
router.get('/projects', adminController.listProjects);
router.get('/projects/:projectId', adminController.getProjectDetails);
router.put('/projects/:projectId', validate(schemas.updateProjectStatus), adminController.updateProjectStatus);

// Payment Management
router.get('/payments', adminController.listPayments);
router.get('/payments/:paymentId', adminController.getPaymentDetails);
router.post('/payments/:paymentId/refund', adminController.refundPayment);

// Dispute Management
router.get('/disputes', adminController.listDisputes);
router.get('/disputes/:disputeId', adminController.getDisputeDetails);
router.post('/disputes/:disputeId/resolve', validate(schemas.resolveDispute), adminController.resolveDispute);

export default router;
