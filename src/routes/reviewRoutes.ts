import { Router } from 'express';
import { reviewController } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';
import { validate, schemas } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post(
  '/project/:projectId',
  validate(schemas.createReview),
  reviewController.createReview
);

router.get('/user/:userId', reviewController.getReviews);
router.get('/project/:projectId/reviews', reviewController.getProjectReviews);

export default router;

