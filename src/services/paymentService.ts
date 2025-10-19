import Razorpay from 'razorpay';
import { query } from '../database/connection';
import { CreatePaymentDTO, PaymentStatus, PaymentType } from '../models/Payment';
import { AppError } from '../middleware/errorHandler';

// Only initialize Razorpay if credentials are provided
let razorpay: Razorpay | null = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

const COMMISSION_PERCENTAGE = parseFloat(process.env.COMMISSION_PERCENTAGE || '10');

export class PaymentService {
  async createPaymentOrder(data: CreatePaymentDTO, studentId: number) {
    if (!razorpay) {
      throw new AppError('Payment gateway not configured. Please contact support.', 503);
    }

    // Get project details
    const projectResult = await query(
      `SELECT p.*, ap.developer_id, ap.price
       FROM projects p
       LEFT JOIN proposals ap ON p.accepted_proposal_id = ap.id
       WHERE p.id = $1`,
      [data.projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const project = projectResult.rows[0];

    // Verify student ownership
    if (project.student_id !== studentId) {
      throw new AppError('Unauthorized to make payment for this project', 403);
    }

    // Calculate amounts
    let amount = 0;
    if (data.paymentType === PaymentType.ADVANCE) {
      amount = project.price * 0.5; // 50% advance
    } else if (data.paymentType === PaymentType.FULL) {
      amount = project.price;
    } else if (data.paymentType === PaymentType.MILESTONE) {
      const milestoneAmount = project.price * (data.milestonePercentage! / 100);
      amount = milestoneAmount;
    }

    const commissionAmount = amount * (COMMISSION_PERCENTAGE / 100);
    const netAmount = amount - commissionAmount;

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `projexhub_${data.projectId}_${Date.now()}`,
      notes: {
        projectId: data.projectId.toString(),
        studentId: studentId.toString(),
        developerId: project.developer_id.toString(),
        paymentType: data.paymentType,
        milestonePercentage: data.milestonePercentage?.toString() || '0'
      }
    });

    // Store payment record
    const paymentResult = await query(
      `INSERT INTO payments (project_id, student_id, developer_id, amount, commission_amount, 
                            net_amount, payment_method, payment_type, milestone_percentage, 
                            razorpay_order_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.projectId,
        studentId,
        project.developer_id,
        amount,
        commissionAmount,
        netAmount,
        data.paymentMethod,
        data.paymentType,
        data.milestonePercentage || 0,
        razorpayOrder.id,
        PaymentStatus.PENDING
      ]
    );

    return {
      payment: paymentResult.rows[0],
      razorpayOrder
    };
  }

  async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
    const generatedSignature = hmac.digest('hex');

    if (generatedSignature !== razorpaySignature) {
      throw new AppError('Invalid payment signature', 400);
    }

    // Update payment status
    const result = await query(
      `UPDATE payments 
       SET status = $1, razorpay_payment_id = $2, razorpay_signature = $3
       WHERE razorpay_order_id = $4
       RETURNING *`,
      [PaymentStatus.COMPLETED, razorpayPaymentId, razorpaySignature, razorpayOrderId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Payment not found', 404);
    }

    const payment = result.rows[0];

    // Update project progress if milestone payment
    if (payment.payment_type === PaymentType.MILESTONE) {
      await query(
        `UPDATE projects SET progress_percentage = $1 WHERE id = $2`,
        [payment.milestone_percentage, payment.project_id]
      );
    }

    // Create notification for developer
    await query(
      `INSERT INTO notifications (user_id, title, message, type, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        payment.developer_id,
        'Payment Received',
        `You received a payment of ₹${payment.net_amount}`,
        'payment',
        payment.id
      ]
    );

    return { message: 'Payment verified successfully', payment: result.rows[0] };
  }

  async getPaymentHistory(userId: number, role: string) {
    const column = role === 'student' ? 'student_id' : 'developer_id';
    
    const result = await query(
      `SELECT p.*, pr.title as project_title
       FROM payments p
       LEFT JOIN projects pr ON p.project_id = pr.id
       WHERE p.${column} = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async getEarnings(developerId: number) {
    const result = await query(
      `SELECT 
         SUM(CASE WHEN status = 'completed' THEN net_amount ELSE 0 END) as total_earnings,
         SUM(CASE WHEN status = 'pending' THEN net_amount ELSE 0 END) as pending_earnings,
         SUM(CASE WHEN status = 'completed' THEN commission_amount ELSE 0 END) as total_commission
       FROM payments
       WHERE developer_id = $1`,
      [developerId]
    );

    return result.rows[0];
  }
}

