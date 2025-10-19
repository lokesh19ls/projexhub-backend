import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ReviewService } from '../services/reviewService';
import { asyncHandler } from '../middleware/errorHandler';

const reviewService = new ReviewService();

export const reviewController = {
  createReview: asyncHandler(async (req: AuthRequest, res: Response) => {
    const review = await reviewService.createReview(
      parseInt(req.params.projectId),
      req.user!.id,
      req.body
    );
    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  }),

  getReviews: asyncHandler(async (req: AuthRequest, res: Response) => {
    const reviews = await reviewService.getReviews(
      parseInt(req.params.userId)
    );
    res.json(reviews);
  }),

  getProjectReviews: asyncHandler(async (req: AuthRequest, res: Response) => {
    const reviews = await reviewService.getProjectReviews(
      parseInt(req.params.projectId)
    );
    res.json(reviews);
  })
};

