import { Router } from 'express';
import { aiController } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/generate-ideas', aiController.generateProjectIdeas);
router.post('/project-suggestions', aiController.getProjectSuggestions);

export default router;

