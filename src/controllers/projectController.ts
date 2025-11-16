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
  }),

  getProjectProgressTracking: asyncHandler(async (req: AuthRequest, res: Response) => {
    const progressData = await projectService.getProjectProgressTracking(
      parseInt(req.params.id),
      req.user!.id
    );
    res.json({
      message: 'Project progress tracking data retrieved successfully',
      data: progressData
    });
  }),

  uploadProjectFile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const file = req.file as Express.Multer.File | undefined;

    const projectFile = await projectService.uploadProjectFile(
      projectId,
      req.user!.id,
      req.user!.role,
      file as Express.Multer.File,
      {
        milestonePercentage: req.body.milestonePercentage,
        description: req.body.description
      }
    );

    res.status(201).json({
      message: 'File uploaded successfully',
      file: projectFile
    });
  }),

  getProjectFiles: asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.projectId);

    const files = await projectService.getProjectFiles(
      projectId,
      req.user!.id,
      req.user!.role
    );

    res.json({
      message: 'Project files retrieved successfully',
      files
    });
  }),

  deleteProjectFile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const projectId = parseInt(req.params.projectId);
    const fileId = parseInt(req.params.fileId);

    await projectService.deleteProjectFile(
      projectId,
      fileId,
      req.user!.id,
      req.user!.role
    );

    res.json({
      message: 'File deleted successfully'
    });
  })
};

