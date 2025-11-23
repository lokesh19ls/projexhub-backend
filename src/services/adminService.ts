import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';

export class AdminService {
  /**
   * Admin login
   */
  async login(email: string, password: string) {
    const result = await query(
      `SELECT * FROM users WHERE email = $1 AND role = 'admin'`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const admin = result.rows[0];

    if (!admin.is_active) {
      throw new AppError('Account is deactivated', 403);
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      role: admin.role
    });

    return {
      token,
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'developer') as total_developers,
        (SELECT COUNT(*) FROM projects WHERE status IN ('in_progress', 'open')) as active_projects,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM payments WHERE status = 'completed') as total_commission,
        (SELECT COUNT(*) FROM users WHERE is_verified = false) as pending_verifications,
        (SELECT COUNT(*) FROM projects WHERE status = 'open') as pending_projects,
        (SELECT COUNT(*) FROM disputes WHERE status IN ('open', 'pending')) as active_disputes
    `);

    // Get recent activity (last 10 activities)
    const recentActivity = await query(`
      (
        SELECT 
          'user_registered' as type,
          'New user registered' as message,
          CONCAT(u.name, ' - ', INITCAP(u.role)) as details,
          u.created_at as timestamp
        FROM users u
        ORDER BY u.created_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 
          'project_created' as type,
          'New project created' as message,
          p.title as details,
          p.created_at as timestamp
        FROM projects p
        ORDER BY p.created_at DESC
        LIMIT 3
      )
      UNION ALL
      (
        SELECT 
          'payment_completed' as type,
          'Payment completed' as message,
          CONCAT('Project: ', pr.title) as details,
          pay.created_at as timestamp
        FROM payments pay
        JOIN projects pr ON pay.project_id = pr.id
        WHERE pay.status = 'completed'
        ORDER BY pay.created_at DESC
        LIMIT 2
      )
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    return {
      totalUsers: parseInt(stats.rows[0].total_users) || 0,
      totalStudents: parseInt(stats.rows[0].total_students) || 0,
      totalDevelopers: parseInt(stats.rows[0].total_developers) || 0,
      activeProjects: parseInt(stats.rows[0].active_projects) || 0,
      totalRevenue: parseFloat(stats.rows[0].total_revenue) || 0,
      totalCommission: parseFloat(stats.rows[0].total_commission) || 0,
      pendingVerifications: parseInt(stats.rows[0].pending_verifications) || 0,
      pendingProjects: parseInt(stats.rows[0].pending_projects) || 0,
      activeDisputes: parseInt(stats.rows[0].active_disputes) || 0,
      recentActivity: recentActivity.rows.map((row: any) => ({
        type: row.type,
        message: row.message,
        details: row.details,
        timestamp: row.timestamp
      }))
    };
  }

  /**
   * List users with filters, search, and pagination
   */
  async listUsers(filters: {
    role?: string;
    isVerified?: boolean;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { role, isVerified, isActive, search, page = 1, limit = 20 } = filters;

    let queryText = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.is_verified as "isVerified",
        u.is_active as "isActive",
        u.rating,
        u.profile_photo as "profilePhoto",
        u.created_at as "createdAt",
        (SELECT COUNT(*) FROM projects WHERE student_id = u.id) as "totalProjects"
      FROM users u
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (role) {
      queryText += ` AND u.role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (isVerified !== undefined) {
      queryText += ` AND u.is_verified = $${paramCount}`;
      params.push(isVerified);
      paramCount++;
    }

    if (isActive !== undefined) {
      queryText += ` AND u.is_active = $${paramCount}`;
      params.push(isActive);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (
        u.name ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount} OR 
        u.phone ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Get total count - build a separate count query
    let countQuery = 'SELECT COUNT(*) as total FROM users u WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 1;

    if (role) {
      countQuery += ` AND u.role = $${countParamCount}`;
      countParams.push(role);
      countParamCount++;
    }

    if (isVerified !== undefined) {
      countQuery += ` AND u.is_verified = $${countParamCount}`;
      countParams.push(isVerified);
      countParamCount++;
    }

    if (isActive !== undefined) {
      countQuery += ` AND u.is_active = $${countParamCount}`;
      countParams.push(isActive);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (
        u.name ILIKE $${countParamCount} OR 
        u.email ILIKE $${countParamCount} OR 
        u.phone ILIKE $${countParamCount}
      )`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total) || 0;

    // Add pagination
    const offset = (page - 1) * limit;
    queryText += ` ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    return {
      data: result.rows.map((row: any) => ({
        id: row.id.toString(),
        name: row.name,
        email: row.email,
        phone: row.phone || null,
        role: row.role,
        isVerified: row.isVerified,
        isActive: row.isActive,
        rating: parseFloat(row.rating) || 0,
        totalProjects: parseInt(row.totalProjects) || 0,
        profilePhoto: row.profilePhoto || null,
        createdAt: row.createdAt
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get user details
   */
  async getUserDetails(userId: string) {
    const result = await query(
      `SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.is_verified as "isVerified",
        u.is_active as "isActive",
        u.rating,
        u.profile_photo as "profilePhoto",
        u.created_at as "createdAt",
        (SELECT COUNT(*) FROM projects WHERE student_id = u.id) as "totalProjects"
      FROM users u
      WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const row = result.rows[0];
    return {
      id: row.id.toString(),
      name: row.name,
      email: row.email,
      phone: row.phone || null,
      role: row.role,
      isVerified: row.isVerified,
      isActive: row.isActive,
      rating: parseFloat(row.rating) || 0,
      totalProjects: parseInt(row.totalProjects) || 0,
      profilePhoto: row.profilePhoto || null,
      createdAt: row.createdAt
    };
  }

  /**
   * Verify user
   */
  async verifyUser(userId: string) {
    const result = await query(
      `UPDATE users SET is_verified = true WHERE id = $1 RETURNING *`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    return { message: 'User verified successfully' };
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: string) {
    const result = await query(
      `UPDATE users SET is_active = false WHERE id = $1 RETURNING *`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    return { message: 'User deactivated successfully' };
  }

  /**
   * List projects with filters, search, and pagination
   */
  async listProjects(filters: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, search, page = 1, limit = 20 } = filters;

    let queryText = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.student_id as "studentId",
        u.name as "studentName",
        p.budget,
        p.status,
        p.technology,
        p.deadline,
        p.created_at as "createdAt",
        (SELECT COUNT(*) FROM proposals WHERE project_id = p.id) as "proposalsCount"
      FROM projects p
      LEFT JOIN users u ON p.student_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      queryText += ` AND (
        p.title ILIKE $${paramCount} OR 
        p.description ILIKE $${paramCount} OR 
        u.name ILIKE $${paramCount}
      )`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Get total count - build a separate count query
    let countQuery = `
      SELECT COUNT(*) as total
      FROM projects p
      LEFT JOIN users u ON p.student_id = u.id
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND p.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (
        p.title ILIKE $${countParamCount} OR 
        p.description ILIKE $${countParamCount} OR 
        u.name ILIKE $${countParamCount}
      )`;
      countParams.push(`%${search}%`);
      countParamCount++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total) || 0;

    // Add pagination
    const offset = (page - 1) * limit;
    queryText += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    return {
      data: result.rows.map((row: any) => ({
        id: row.id.toString(),
        title: row.title,
        description: row.description,
        studentId: row.studentId.toString(),
        studentName: row.studentName,
        budget: parseFloat(row.budget),
        status: row.status,
        technologies: row.technology || [],
        proposalsCount: parseInt(row.proposalsCount) || 0,
        createdAt: row.createdAt,
        deadline: row.deadline
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get project details
   */
  async getProjectDetails(projectId: string) {
    const result = await query(
      `SELECT 
        p.id,
        p.title,
        p.description,
        p.student_id as "studentId",
        u.name as "studentName",
        p.budget,
        p.status,
        p.technology,
        p.deadline,
        p.created_at as "createdAt",
        (SELECT COUNT(*) FROM proposals WHERE project_id = p.id) as "proposalsCount"
      FROM projects p
      LEFT JOIN users u ON p.student_id = u.id
      WHERE p.id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const row = result.rows[0];
    return {
      id: row.id.toString(),
      title: row.title,
      description: row.description,
      studentId: row.studentId.toString(),
      studentName: row.studentName,
      budget: parseFloat(row.budget),
      status: row.status,
      technologies: row.technology || [],
      proposalsCount: parseInt(row.proposalsCount) || 0,
      createdAt: row.createdAt,
      deadline: row.deadline
    };
  }

  /**
   * Update project status
   */
  async updateProjectStatus(projectId: string, status: string) {
    const validStatuses = ['open', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const result = await query(
      `UPDATE projects SET status = $1 WHERE id = $2 RETURNING *`,
      [status, projectId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    return { message: 'Project status updated successfully' };
  }

  /**
   * List payments with filters and pagination
   * Note: razorpayFee is calculated as 2.36% of grossAmount (Razorpay's standard fee)
   */
  async listPayments(filters: {
    status?: string;
    paymentType?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, paymentType, page = 1, limit = 20 } = filters;

    let queryText = `
      SELECT 
        p.id,
        p.project_id as "projectId",
        pr.title as "projectTitle",
        p.student_id as "studentId",
        u1.name as "studentName",
        p.developer_id as "developerId",
        u2.name as "developerName",
        p.amount as "grossAmount",
        p.commission_amount as "commissionAmount",
        p.net_amount as "netAmount",
        p.status,
        p.payment_method as "paymentMethod",
        p.payment_type as "paymentType",
        p.razorpay_payment_id as "razorpayPaymentId",
        p.created_at as "createdAt"
      FROM payments p
      LEFT JOIN projects pr ON p.project_id = pr.id
      LEFT JOIN users u1 ON p.student_id = u1.id
      LEFT JOIN users u2 ON p.developer_id = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (paymentType) {
      queryText += ` AND p.payment_type = $${paramCount}`;
      params.push(paymentType);
      paramCount++;
    }

    // Get total count - build a separate count query
    let countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND p.status = $${countParamCount}`;
      countParams.push(status);
      countParamCount++;
    }

    if (paymentType) {
      countQuery += ` AND p.payment_type = $${countParamCount}`;
      countParams.push(paymentType);
      countParamCount++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total) || 0;

    // Add pagination
    const offset = (page - 1) * limit;
    queryText += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    return {
      data: result.rows.map((row: any) => {
        const grossAmount = parseFloat(row.grossAmount);
        // Razorpay fee is typically 2.36% of the transaction amount
        const razorpayFee = Math.round(grossAmount * 0.0236);
        const commissionAmount = parseFloat(row.commissionAmount) || 0;
        const netAmount = parseFloat(row.netAmount) || 0;

        return {
          id: row.id.toString(),
          projectId: row.projectId.toString(),
          projectTitle: row.projectTitle,
          studentId: row.studentId.toString(),
          studentName: row.studentName,
          developerId: row.developerId.toString(),
          developerName: row.developerName,
          grossAmount,
          razorpayFee,
          commissionAmount,
          netAmount,
          status: row.status,
          paymentMethod: row.paymentMethod,
          paymentType: row.paymentType,
          createdAt: row.createdAt,
          razorpayPaymentId: row.razorpayPaymentId || null
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string) {
    const result = await query(
      `SELECT 
        p.id,
        p.project_id as "projectId",
        pr.title as "projectTitle",
        p.student_id as "studentId",
        u1.name as "studentName",
        p.developer_id as "developerId",
        u2.name as "developerName",
        p.amount as "grossAmount",
        p.commission_amount as "commissionAmount",
        p.net_amount as "netAmount",
        p.status,
        p.payment_method as "paymentMethod",
        p.payment_type as "paymentType",
        p.razorpay_payment_id as "razorpayPaymentId",
        p.created_at as "createdAt"
      FROM payments p
      LEFT JOIN projects pr ON p.project_id = pr.id
      LEFT JOIN users u1 ON p.student_id = u1.id
      LEFT JOIN users u2 ON p.developer_id = u2.id
      WHERE p.id = $1`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Payment not found', 404);
    }

    const row = result.rows[0];
    const grossAmount = parseFloat(row.grossAmount);
    const razorpayFee = Math.round(grossAmount * 0.0236);
    const commissionAmount = parseFloat(row.commissionAmount) || 0;
    const netAmount = parseFloat(row.netAmount) || 0;

    return {
      id: row.id.toString(),
      projectId: row.projectId.toString(),
      projectTitle: row.projectTitle,
      studentId: row.studentId.toString(),
      studentName: row.studentName,
      developerId: row.developerId.toString(),
      developerName: row.developerName,
      grossAmount,
      razorpayFee,
      commissionAmount,
      netAmount,
      status: row.status,
      paymentMethod: row.paymentMethod,
      paymentType: row.paymentType,
      createdAt: row.createdAt,
      razorpayPaymentId: row.razorpayPaymentId || null
    };
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentId: string) {
    const result = await query(
      `UPDATE payments SET status = 'refunded' WHERE id = $1 RETURNING *`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Payment not found', 404);
    }

    return { message: 'Payment refunded successfully' };
  }

  /**
   * List disputes with filters and pagination
   */
  async listDisputes(filters: {
    status?: string;
    raisedBy?: string;
    page?: number;
    limit?: number;
  }) {
    const { status, raisedBy, page = 1, limit = 20 } = filters;

    let queryText = `
      SELECT 
        d.id,
        d.project_id as "projectId",
        pr.title as "projectTitle",
        d.raised_by as "raisedBy",
        u1.name as "raisedByName",
        u1.role as "raisedByRole",
        pr.student_id as "studentId",
        u2.name as "studentName",
        (SELECT developer_id FROM proposals WHERE id = pr.accepted_proposal_id) as "developerId",
        u3.name as "developerName",
        d.reason,
        d.description,
        d.status,
        d.resolution,
        d.resolved_by as "resolvedBy",
        d.created_at as "createdAt",
        d.updated_at as "updatedAt"
      FROM disputes d
      LEFT JOIN projects pr ON d.project_id = pr.id
      LEFT JOIN users u1 ON d.raised_by = u1.id
      LEFT JOIN users u2 ON pr.student_id = u2.id
      LEFT JOIN proposals prop ON pr.accepted_proposal_id = prop.id
      LEFT JOIN users u3 ON prop.developer_id = u3.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      // Map 'pending' to 'open' for database query (DB uses 'open', API uses 'pending')
      const dbStatus = status === 'pending' ? 'open' : status;
      queryText += ` AND d.status = $${paramCount}`;
      params.push(dbStatus);
      paramCount++;
    }

    if (raisedBy) {
      // Check if raisedBy matches the role of the user who raised the dispute
      queryText += ` AND u1.role = $${paramCount}`;
      params.push(raisedBy);
      paramCount++;
    }

    // Get total count - build a separate count query
    let countQuery = `
      SELECT COUNT(*) as total
      FROM disputes d
      LEFT JOIN users u1 ON d.raised_by = u1.id
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 1;

    if (status) {
      // Map 'pending' to 'open' for database query (DB uses 'open', API uses 'pending')
      const dbStatus = status === 'pending' ? 'open' : status;
      countQuery += ` AND d.status = $${countParamCount}`;
      countParams.push(dbStatus);
      countParamCount++;
    }

    if (raisedBy) {
      // Check if raisedBy matches the role of the user who raised the dispute
      countQuery += ` AND u1.role = $${countParamCount}`;
      countParams.push(raisedBy);
      countParamCount++;
    }

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total) || 0;

    // Add pagination
    const offset = (page - 1) * limit;
    queryText += ` ORDER BY d.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const result = await query(queryText, params);

    return {
      data: result.rows.map((row: any) => ({
        id: row.id.toString(),
        projectId: row.projectId.toString(),
        projectTitle: row.projectTitle,
        studentId: row.studentId?.toString() || null,
        studentName: row.studentName,
        developerId: row.developerId?.toString() || null,
        developerName: row.developerName,
        reason: row.reason,
        description: row.description || null,
        status: row.status === 'open' ? 'pending' : row.status, // Map 'open' to 'pending' for API
        raisedBy: row.raisedByRole, // 'student' or 'developer'
        resolution: row.resolution || null,
        resolutionNotes: row.resolution || null, // Using resolution as notes for now
        createdAt: row.createdAt,
        resolvedAt: row.status === 'resolved' ? row.updatedAt : null
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Get dispute details
   */
  async getDisputeDetails(disputeId: string) {
    const result = await query(
      `SELECT 
        d.id,
        d.project_id as "projectId",
        pr.title as "projectTitle",
        d.raised_by as "raisedBy",
        u1.name as "raisedByName",
        u1.role as "raisedByRole",
        pr.student_id as "studentId",
        u2.name as "studentName",
        (SELECT developer_id FROM proposals WHERE id = pr.accepted_proposal_id) as "developerId",
        u3.name as "developerName",
        d.reason,
        d.description,
        d.status,
        d.resolution,
        d.resolved_by as "resolvedBy",
        d.created_at as "createdAt",
        d.updated_at as "updatedAt"
      FROM disputes d
      LEFT JOIN projects pr ON d.project_id = pr.id
      LEFT JOIN users u1 ON d.raised_by = u1.id
      LEFT JOIN users u2 ON pr.student_id = u2.id
      LEFT JOIN proposals prop ON pr.accepted_proposal_id = prop.id
      LEFT JOIN users u3 ON prop.developer_id = u3.id
      WHERE d.id = $1`,
      [disputeId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Dispute not found', 404);
    }

    const row = result.rows[0];
    return {
      id: row.id.toString(),
      projectId: row.projectId.toString(),
      projectTitle: row.projectTitle,
      studentId: row.studentId?.toString() || null,
      studentName: row.studentName,
      developerId: row.developerId?.toString() || null,
      developerName: row.developerName,
      reason: row.reason,
      description: row.description || null,
      status: row.status === 'open' ? 'pending' : row.status, // Map 'open' to 'pending' for API
      raisedBy: row.raisedByRole, // 'student' or 'developer'
      resolution: row.resolution || null,
      resolutionNotes: row.resolution || null,
      createdAt: row.createdAt,
      resolvedAt: row.status === 'resolved' ? row.updatedAt : null
    };
  }

  /**
   * Resolve dispute
   */
  async resolveDispute(disputeId: string, adminId: number, resolution: string, notes?: string) {
    const validResolutions = ['favor_student', 'favor_developer', 'partial', 'dismiss'];
    if (!validResolutions.includes(resolution)) {
      throw new AppError('Invalid resolution option', 400);
    }

    // Store resolution and notes (using notes as resolution text for now)
    const resolutionText = notes || resolution;

    const result = await query(
      `UPDATE disputes 
       SET status = 'resolved', 
           resolved_by = $1, 
           resolution = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [adminId, resolutionText, disputeId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Dispute not found', 404);
    }

    // TODO: Implement payment refund/release logic based on resolution
    // For now, just update the dispute status

    return { message: 'Dispute resolved successfully' };
  }
}

