import { Router } from 'express';
import { homeController } from '../controllers/homeController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protected route
router.get('/', authenticate, homeController.getHomeData);

export default router;

