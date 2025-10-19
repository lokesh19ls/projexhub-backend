import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProjectService } from '../services/projectService';
import { asyncHandler } from '../middleware/errorHandler';

const projectService = new ProjectService();

export const projectController = {
  createProject: asyncHandler(async (req: AuthRequest, res: Response) => {
    const project = await projectService.createProject(req.user!.id, req.body);
    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  }),

  getProjectById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const project = await projectService.getProjectById(
      parseInt(req.params.id),
      req.user?.id
    );
    res.json(project);
  }),

  getProjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const projects = await projectService.getProjects({
      status: req.query.status as any,
      technology: req.query.technology as string,
      minBudget: req.query.minBudget ? parseFloat(req.query.minBudget as string) : undefined,
      maxBudget: req.query.maxBudget ? parseFloat(req.query.maxBudget as string) : undefined,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    });
    res.json(projects);
  }),

  updateProject: asyncHandler(async (req: AuthRequest, res: Response) => {
    const project = await projectService.updateProject(
      parseInt(req.params.id),
      req.user!.id,
      req.body
    );
    res.json({
      message: 'Project updated successfully',
      project
    });
  }),

  deleteProject: asyncHandler(async (req: AuthRequest, res: Response) => {
    await projectService.deleteProject(parseInt(req.params.id), req.user!.id);
    res.json({ message: 'Project deleted successfully' });
  }),

  getUserProjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const projects = await projectService.getUserProjects(
      req.user!.id,
      req.user!.role
    );
    res.json(projects);
  })
};

