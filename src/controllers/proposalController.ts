import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProposalService } from '../services/proposalService';
import { asyncHandler } from '../middleware/errorHandler';

const proposalService = new ProposalService();

export const proposalController = {
  createProposal: asyncHandler(async (req: AuthRequest, res: Response) => {
    const proposal = await proposalService.createProposal(
      parseInt(req.params.projectId),
      req.user!.id,
      req.body
    );
    res.status(201).json({
      message: 'Proposal sent successfully',
      proposal
    });
  }),

  getProposalById: asyncHandler(async (req: AuthRequest, res: Response) => {
    const proposal = await proposalService.getProposalById(parseInt(req.params.id));
    res.json(proposal);
  }),

  getProjectProposals: asyncHandler(async (req: AuthRequest, res: Response) => {
    const proposals = await proposalService.getProjectProposals(
      parseInt(req.params.projectId)
    );
    res.json(proposals);
  }),

  getUserProposals: asyncHandler(async (req: AuthRequest, res: Response) => {
    const proposals = await proposalService.getUserProposals(req.user!.id);
    res.json(proposals);
  }),

  acceptProposal: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await proposalService.acceptProposal(
      parseInt(req.params.id),
      req.user!.id
    );
    res.json(result);
  }),

  rejectProposal: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await proposalService.rejectProposal(
      parseInt(req.params.id),
      req.user!.id
    );
    res.json(result);
  })
};

