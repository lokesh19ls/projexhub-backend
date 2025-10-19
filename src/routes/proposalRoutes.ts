import { Router } from 'express';
import { proposalController } from '../controllers/proposalController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { UserRole } from '../models/User';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Developer routes
router.post(
  '/project/:projectId',
  authorize(UserRole.DEVELOPER, UserRole.ADMIN),
  validate(schemas.createProposal),
  proposalController.createProposal
);

router.get('/my-proposals', proposalController.getUserProposals);

// Student routes
router.get(
  '/project/:projectId',
  authorize(UserRole.STUDENT, UserRole.ADMIN),
  proposalController.getProjectProposals
);

router.post(
  '/:id/accept',
  authorize(UserRole.STUDENT, UserRole.ADMIN),
  proposalController.acceptProposal
);

router.post(
  '/:id/reject',
  authorize(UserRole.STUDENT, UserRole.ADMIN),
  proposalController.rejectProposal
);

// Common routes
router.get('/:id', proposalController.getProposalById);

export default router;

