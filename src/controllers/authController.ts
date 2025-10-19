import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/authService';
import { asyncHandler } from '../middleware/errorHandler';

const authService = new AuthService();

export const authController = {
  register: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      token: result.token
    });
  }),

  login: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, phone, password } = req.body;
    const result = await authService.login(email, phone, password);
    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  }),

  sendOTP: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { phone, email } = req.body;
    const result = await authService.sendOTP(phone, email);
    res.json(result);
  }),

  verifyOTP: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { phone, email, otp } = req.body;
    const result = await authService.verifyOTP(phone, email, otp);
    res.json(result);
  }),

  getProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await authService.getProfile(req.user!.id);
    res.json(profile);
  }),

  updateProfile: asyncHandler(async (_req: AuthRequest, res: Response) => {
    // This will be implemented in userController
    res.json({ message: 'Profile update endpoint' });
  })
};

