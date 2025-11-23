import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { AdminService } from '../services/adminService';

const adminService = new AdminService();

export const adminController = {
  // Authentication
  login: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;
    const result = await adminService.login(email, password);
    res.json(result);
  }),

  // Dashboard
  getDashboardStats: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const stats = await adminService.getDashboardStats();
    res.json({ data: stats });
  }),

  // User Management
  listUsers: asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      role,
      isVerified,
      isActive,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const filters: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    if (role) filters.role = role as string;
    if (isVerified !== undefined) filters.isVerified = isVerified === 'true';
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search as string;

    const result = await adminService.listUsers(filters);
    res.json(result);
  }),

  getUserDetails: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const user = await adminService.getUserDetails(userId);
    res.json({ data: user });
  }),

  verifyUser: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    await adminService.verifyUser(userId);
    res.status(200).json({ message: 'User verified successfully' });
  }),

  deactivateUser: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    await adminService.deactivateUser(userId);
    res.status(200).json({ message: 'User deactivated successfully' });
  }),

  // Project Management
  listProjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      status,
      search,
      page = '1',
      limit = '20'
    } = req.query;

    const filters: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    if (status) filters.status = status as string;
    if (search) filters.search = search as string;

    const result = await adminService.listProjects(filters);
    res.json(result);
  }),

  getProjectDetails: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const project = await adminService.getProjectDetails(projectId);
    res.json({ data: project });
  }),

  updateProjectStatus: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { projectId } = req.params;
    const { status } = req.body;
    await adminService.updateProjectStatus(projectId, status);
    res.status(200).json({ message: 'Project status updated successfully' });
  }),

  // Payment Management
  listPayments: asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      status,
      paymentType,
      page = '1',
      limit = '20'
    } = req.query;

    const filters: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    if (status) filters.status = status as string;
    if (paymentType) filters.paymentType = paymentType as string;

    const result = await adminService.listPayments(filters);
    res.json(result);
  }),

  getPaymentDetails: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { paymentId } = req.params;
    const payment = await adminService.getPaymentDetails(paymentId);
    res.json({ data: payment });
  }),

  refundPayment: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { paymentId } = req.params;
    await adminService.refundPayment(paymentId);
    res.status(200).json({ message: 'Payment refunded successfully' });
  }),

  // Dispute Management
  listDisputes: asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      status,
      raisedBy,
      page = '1',
      limit = '20'
    } = req.query;

    const filters: any = {
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    };

    if (status) filters.status = status as string;
    if (raisedBy) filters.raisedBy = raisedBy as string;

    const result = await adminService.listDisputes(filters);
    res.json(result);
  }),

  getDisputeDetails: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { disputeId } = req.params;
    const dispute = await adminService.getDisputeDetails(disputeId);
    res.json({ data: dispute });
  }),

  resolveDispute: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { disputeId } = req.params;
    const { resolution, notes } = req.body;
    await adminService.resolveDispute(disputeId, req.user!.id, resolution, notes);
    res.status(200).json({ message: 'Dispute resolved successfully' });
  })
};
