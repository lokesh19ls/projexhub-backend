import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DevService } from '../services/devService';
import { asyncHandler } from '../middleware/errorHandler';

const devService = new DevService();

export const devController = {
  getDeveloperHome: asyncHandler(async (req: AuthRequest, res: Response) => {
    const homeData = await devService.getDeveloperHomeData(req.user!.id);
    res.json(homeData);
  })
};

