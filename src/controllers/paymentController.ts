import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PaymentService } from '../services/paymentService';
import { asyncHandler } from '../middleware/errorHandler';

const paymentService = new PaymentService();

export const paymentController = {
  createPaymentOrder: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await paymentService.createPaymentOrder(
      { ...req.body, projectId: parseInt(req.params.projectId) },
      req.user!.id
    );
    res.status(201).json(result);
  }),

  verifyPayment: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const result = await paymentService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );
    res.json(result);
  }),

  getPaymentHistory: asyncHandler(async (req: AuthRequest, res: Response) => {
    const payments = await paymentService.getPaymentHistory(
      req.user!.id,
      req.user!.role
    );
    res.json(payments);
  }),

  getEarnings: asyncHandler(async (req: AuthRequest, res: Response) => {
    const earnings = await paymentService.getEarnings(req.user!.id);
    res.json(earnings);
  }),

  getProjectPayments: asyncHandler(async (req: AuthRequest, res: Response) => {
    const payments = await paymentService.getProjectPayments(
      parseInt(req.params.projectId),
      req.user!.id
    );
    res.json({
      message: 'Project payments retrieved successfully',
      data: payments
    });
  }),

  getPaymentSummary: asyncHandler(async (req: AuthRequest, res: Response) => {
    const summary = await paymentService.getPaymentSummary(req.user!.id);
    res.json({
      message: 'Payment summary retrieved successfully',
      data: summary
    });
  })
};

