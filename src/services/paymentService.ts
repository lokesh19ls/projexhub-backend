import Razorpay from 'razorpay';
import { query } from '../database/connection';
import { CreatePaymentDTO, PaymentStatus, PaymentType } from '../models/Payment';
import { AppError } from '../middleware/errorHandler';
import { createNotificationAndSendPush } from '../utils/fcm';

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

    // Check if project has an accepted proposal
    if (!project.accepted_proposal_id || !project.developer_id) {
      throw new AppError('Project must have an accepted proposal before making payment', 400);
    }

    // Validate milestone payment
    if (data.paymentType === PaymentType.MILESTONE) {
      if (!data.milestonePercentage || ![20, 50, 100].includes(data.milestonePercentage)) {
        throw new AppError('Milestone percentage must be 20, 50, or 100', 400);
      }

      // Check if milestone payment already exists
      const existingMilestonePayment = await query(
        `SELECT id FROM payments 
         WHERE project_id = $1 
         AND payment_type = $2 
         AND milestone_percentage = $3 
         AND status = $4`,
        [data.projectId, PaymentType.MILESTONE, data.milestonePercentage, PaymentStatus.COMPLETED]
      );

      if (existingMilestonePayment.rows.length > 0) {
        throw new AppError(`${data.milestonePercentage}% milestone payment already completed`, 400);
      }
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

    // Create notification + push for developer
    await createNotificationAndSendPush({
      userId: payment.developer_id,
      title: 'Payment Received',
      message: `You received a payment of ₹${payment.net_amount}`,
      type: 'payment',
      relatedId: payment.id,
      data: {
        projectId: payment.project_id,
        paymentId: payment.id,
        paymentType: payment.payment_type,
        milestonePercentage: payment.milestone_percentage,
        screen: 'payment_history'
      }
    });

    return { message: 'Payment verified successfully', payment: result.rows[0] };
  }

  async getPaymentHistory(userId: number, role: string) {
    const column = role === 'student' ? 'student_id' : 'developer_id';
    
    const result = await query(
      `SELECT p.*, pr.title as project_title, pr.status as project_status
       FROM payments p
       LEFT JOIN projects pr ON p.project_id = pr.id
       WHERE p.${column} = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return result.rows.map(payment => ({
      id: payment.id,
      projectId: payment.project_id,
      projectTitle: payment.project_title,
      projectStatus: payment.project_status,
      amount: parseFloat(payment.amount),
      netAmount: parseFloat(payment.net_amount),
      commissionAmount: parseFloat(payment.commission_amount),
      paymentMethod: payment.payment_method,
      paymentType: payment.payment_type,
      milestonePercentage: payment.milestone_percentage,
      milestoneLabel: payment.payment_type === PaymentType.MILESTONE 
        ? `${payment.milestone_percentage}% Milestone Payment`
        : payment.payment_type === PaymentType.ADVANCE
        ? 'Advance Payment (50%)'
        : payment.payment_type === PaymentType.FULL
        ? 'Full Payment'
        : null,
      status: payment.status,
      razorpayOrderId: payment.razorpay_order_id,
      razorpayPaymentId: payment.razorpay_payment_id,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at
    }));
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

  async getProjectPayments(projectId: number, studentId: number) {
    // Verify student owns the project
    const projectResult = await query(
      `SELECT p.*, ap.price, ap.timeline
       FROM projects p
       LEFT JOIN proposals ap ON p.accepted_proposal_id = ap.id
       WHERE p.id = $1 AND p.student_id = $2`,
      [projectId, studentId]
    );

    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found or unauthorized', 404);
    }

    const project = projectResult.rows[0];

    // Get all payments for this project
    const paymentsResult = await query(
      `SELECT * FROM payments 
       WHERE project_id = $1 
       ORDER BY created_at DESC`,
      [projectId]
    );

    const payments = paymentsResult.rows;

    // Calculate payment statistics
    const totalPaid = payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const totalPending = payments
      .filter(p => p.status === PaymentStatus.PENDING)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const projectPrice = project.price ? parseFloat(project.price) : 0;
    const remainingAmount = projectPrice - totalPaid;

    // Track milestone payments
    const milestonePayments = {
      20: payments.find(p => p.payment_type === PaymentType.MILESTONE && p.milestone_percentage === 20 && p.status === PaymentStatus.COMPLETED) || null,
      50: payments.find(p => p.payment_type === PaymentType.MILESTONE && p.milestone_percentage === 50 && p.status === PaymentStatus.COMPLETED) || null,
      100: payments.find(p => p.payment_type === PaymentType.MILESTONE && p.milestone_percentage === 100 && p.status === PaymentStatus.COMPLETED) || null
    };

    // Check for advance payment
    const advancePayment = payments.find(p => p.payment_type === PaymentType.ADVANCE && p.status === PaymentStatus.COMPLETED);
    const fullPayment = payments.find(p => p.payment_type === PaymentType.FULL && p.status === PaymentStatus.COMPLETED);

    return {
      project: {
        id: project.id,
        title: project.title,
        price: projectPrice,
        totalPaid,
        remainingAmount,
        totalPending
      },
      payments: payments.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount),
        netAmount: parseFloat(p.net_amount),
        commissionAmount: parseFloat(p.commission_amount),
        paymentMethod: p.payment_method,
        paymentType: p.payment_type,
        milestonePercentage: p.milestone_percentage,
        status: p.status,
        razorpayOrderId: p.razorpay_order_id,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })),
      milestones: {
        20: milestonePayments[20] ? {
          paid: true,
          amount: parseFloat(milestonePayments[20].amount),
          paidAt: milestonePayments[20].updated_at,
          paymentId: milestonePayments[20].id
        } : { paid: false, amount: projectPrice * 0.2, paidAt: null, paymentId: null },
        50: milestonePayments[50] ? {
          paid: true,
          amount: parseFloat(milestonePayments[50].amount),
          paidAt: milestonePayments[50].updated_at,
          paymentId: milestonePayments[50].id
        } : { paid: false, amount: projectPrice * 0.5, paidAt: null, paymentId: null },
        100: milestonePayments[100] ? {
          paid: true,
          amount: parseFloat(milestonePayments[100].amount),
          paidAt: milestonePayments[100].updated_at,
          paymentId: milestonePayments[100].id
        } : { paid: false, amount: projectPrice * 1.0, paidAt: null, paymentId: null }
      },
      advancePayment: advancePayment ? {
        paid: true,
        amount: parseFloat(advancePayment.amount),
        paidAt: advancePayment.updated_at,
        paymentId: advancePayment.id
      } : { paid: false, amount: projectPrice * 0.5, paidAt: null, paymentId: null },
      fullPayment: fullPayment ? {
        paid: true,
        amount: parseFloat(fullPayment.amount),
        paidAt: fullPayment.updated_at,
        paymentId: fullPayment.id
      } : null
    };
  }

  async getPaymentScreenData(projectId: number, studentId: number) {
    // Verify student owns the project
    const projectResult = await query(
      `SELECT p.*, ap.price, ap.timeline
       FROM projects p
       LEFT JOIN proposals ap ON p.accepted_proposal_id = ap.id
       WHERE p.id = $1 AND p.student_id = $2`,
      [projectId, studentId]
    );

    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found or unauthorized', 404);
    }

    const project = projectResult.rows[0];

    // Check if project has an accepted proposal
    if (!project.accepted_proposal_id || !project.price) {
      throw new AppError('Project must have an accepted proposal before making payment', 400);
    }

    const projectPrice = parseFloat(project.price);
    const projectBudget = parseFloat(project.budget);

    // Get existing payments
    const paymentsResult = await query(
      `SELECT * FROM payments 
       WHERE project_id = $1 
       ORDER BY created_at DESC`,
      [projectId]
    );

    const payments = paymentsResult.rows;
    const completedPayments = payments.filter(p => p.status === PaymentStatus.COMPLETED);
    const totalPaid = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const remainingAmount = projectPrice - totalPaid;

    // Check which payment types have been used
    const hasAdvancePayment = completedPayments.some(p => p.payment_type === PaymentType.ADVANCE);
    const hasFullPayment = completedPayments.some(p => p.payment_type === PaymentType.FULL);
    const milestonePayments = {
      20: completedPayments.some(p => p.payment_type === PaymentType.MILESTONE && p.milestone_percentage === 20),
      50: completedPayments.some(p => p.payment_type === PaymentType.MILESTONE && p.milestone_percentage === 50),
      100: completedPayments.some(p => p.payment_type === PaymentType.MILESTONE && p.milestone_percentage === 100)
    };

    // Calculate payment type options
    const paymentTypes = [
      {
        type: 'advance',
        label: 'Advance Payment',
        description: '50% advance payment to start the project',
        amount: projectPrice * 0.5,
        available: !hasAdvancePayment && !hasFullPayment && remainingAmount > 0
      },
      {
        type: 'full',
        label: 'Full Payment',
        description: 'Complete project payment',
        amount: remainingAmount,
        available: !hasFullPayment && !hasAdvancePayment && remainingAmount > 0
      },
      {
        type: 'milestone',
        label: 'Milestone Payment',
        description: 'Pay based on project milestones',
        milestones: [
          {
            percentage: 20,
            amount: projectPrice * 0.2,
            available: !milestonePayments[20] && !hasFullPayment && remainingAmount > 0
          },
          {
            percentage: 50,
            amount: projectPrice * 0.5,
            available: !milestonePayments[50] && !hasFullPayment && remainingAmount > 0
          },
          {
            percentage: 100,
            amount: remainingAmount,
            available: !milestonePayments[100] && !hasFullPayment && remainingAmount > 0
          }
        ]
      }
    ];

    // Available payment methods
    const paymentMethods = [
      { method: 'upi', label: 'UPI', available: true },
      { method: 'card', label: 'Card', available: true },
      { method: 'wallet', label: 'Wallet', available: true },
      { method: 'netbanking', label: 'Netbanking', available: true }
    ];

    return {
      project: {
        id: project.id,
        title: project.title,
        budget: projectBudget,
        proposedPrice: projectPrice
      },
      paymentSummary: {
        totalPaid,
        remainingAmount,
        totalAmount: projectPrice
      },
      paymentTypes,
      paymentMethods,
      hasAcceptedProposal: true
    };
  }

  async getPaymentSummary(studentId: number) {
    // Get all payments for the student
    const paymentsResult = await query(
      `SELECT p.*, pr.title as project_title, pr.status as project_status
       FROM payments p
       LEFT JOIN projects pr ON p.project_id = pr.id
       WHERE p.student_id = $1
       ORDER BY p.created_at DESC`,
      [studentId]
    );

    const payments = paymentsResult.rows;

    // Calculate statistics
    const totalPaid = payments
      .filter(p => p.status === PaymentStatus.COMPLETED)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const totalPending = payments
      .filter(p => p.status === PaymentStatus.PENDING)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const totalFailed = payments
      .filter(p => p.status === PaymentStatus.FAILED)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const totalRefunded = payments
      .filter(p => p.status === PaymentStatus.REFUNDED)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Group by payment type
    const byType = {
      advance: payments.filter(p => p.payment_type === PaymentType.ADVANCE && p.status === PaymentStatus.COMPLETED).length,
      full: payments.filter(p => p.payment_type === PaymentType.FULL && p.status === PaymentStatus.COMPLETED).length,
      milestone: payments.filter(p => p.payment_type === PaymentType.MILESTONE && p.status === PaymentStatus.COMPLETED).length
    };

    // Recent payments (last 10)
    const recentPayments = payments.slice(0, 10).map(p => ({
      id: p.id,
      projectId: p.project_id,
      projectTitle: p.project_title,
      amount: parseFloat(p.amount),
      paymentType: p.payment_type,
      milestonePercentage: p.milestone_percentage,
      status: p.status,
      createdAt: p.created_at
    }));

    return {
      summary: {
        totalPaid,
        totalPending,
        totalFailed,
        totalRefunded,
        totalTransactions: payments.length,
        completedTransactions: payments.filter(p => p.status === PaymentStatus.COMPLETED).length
      },
      byType,
      recentPayments
    };
  }
}

