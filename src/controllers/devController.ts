import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DevService } from '../services/devService';
import { asyncHandler } from '../middleware/errorHandler';

const devService = new DevService();

export const devController = {
  getDeveloperHome: asyncHandler(async (req: AuthRequest, res: Response) => {
    const homeData = await devService.getDeveloperHomeData(req.user!.id);
    res.json(homeData);
  }),

  browseProjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const projects = await devService.browseProjects(req.user!.id, {
      status: req.query.status as string,
      technology: req.query.technology as string,
      minBudget: req.query.minBudget ? parseFloat(req.query.minBudget as string) : undefined,
      maxBudget: req.query.maxBudget ? parseFloat(req.query.maxBudget as string) : undefined,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    });
    res.json(projects);
  }),

  updateProgress: asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const result = await devService.updateProjectProgress(
      projectId,
      req.user!.id,
      {
        progressPercentage: req.body.progressPercentage,
        status: req.body.status,
        progressNote: req.body.progressNote
      }
    );
    res.json({
      message: 'Project progress updated successfully',
      ...result
    });
  })
};

