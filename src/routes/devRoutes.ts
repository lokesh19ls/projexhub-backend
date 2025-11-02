import { Router } from 'express';
import { devController } from '../controllers/devController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/home', devController.getDeveloperHome);
router.get('/projects', devController.browseProjects);

export default router;

