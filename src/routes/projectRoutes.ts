import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { UserRole } from '../models/User';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Student routes
router.post(
  '/',
  authorize(UserRole.STUDENT, UserRole.ADMIN),
  validate(schemas.createProject),
  projectController.createProject
);

router.get('/', projectController.getProjects);
router.get('/my-projects', projectController.getUserProjects);
router.get('/:id', projectController.getProjectById);

router.put(
  '/:id',
  authorize(UserRole.STUDENT, UserRole.ADMIN),
  projectController.updateProject
);

router.delete(
  '/:id',
  authorize(UserRole.STUDENT, UserRole.ADMIN),
  projectController.deleteProject
);

export default router;

