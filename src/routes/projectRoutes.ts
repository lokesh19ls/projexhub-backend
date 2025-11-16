import { Router } from 'express';
import { projectController } from '../controllers/projectController';
import { authenticate, authorize } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';
import { UserRole } from '../models/User';
import { uploadFile } from '../middleware/upload';

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
router.get('/:id/progress', authorize(UserRole.STUDENT, UserRole.ADMIN), projectController.getProjectProgressTracking);
router.get('/:id', projectController.getProjectById);

// Project files (developer upload, both roles view, developer/admin delete)
router.post(
  '/:projectId/files',
  authorize(UserRole.DEVELOPER, UserRole.ADMIN),
  uploadFile,
  validate(schemas.uploadProjectFile),
  projectController.uploadProjectFile
);

router.get(
  '/:projectId/files',
  projectController.getProjectFiles
);

router.delete(
  '/:projectId/files/:fileId',
  authorize(UserRole.DEVELOPER, UserRole.ADMIN),
  projectController.deleteProjectFile
);

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

