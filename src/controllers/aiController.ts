import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AIService } from '../services/aiService';
import { asyncHandler } from '../middleware/errorHandler';

const aiService = new AIService();

export const aiController = {
  generateProjectIdeas: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { department, technology, difficulty } = req.body;
    const ideas = await aiService.generateProjectIdeas(
      department,
      technology,
      difficulty
    );
    res.json(ideas);
  }),

  getProjectSuggestions: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { currentProject } = req.body;
    const suggestions = await aiService.getProjectSuggestions(currentProject);
    res.json(suggestions);
  })
};

