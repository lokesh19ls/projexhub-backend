import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { HomeService } from '../services/homeService';
import { asyncHandler } from '../middleware/errorHandler';

const homeService = new HomeService();

export const homeController = {
  getHomeData: asyncHandler(async (req: AuthRequest, res: Response) => {
    const homeData = await homeService.getHomeData(req.user!.id, req.user!.role);
    res.json(homeData);
  })
};

