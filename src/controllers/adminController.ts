import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { query } from '../database/connection';
import { asyncHandler } from '../middleware/errorHandler';
import { AppError } from '../middleware/errorHandler';

export const adminController = {
  // User Management
  getAllUsers: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { role, isVerified, isActive, page = 1, limit = 20 } = req.query;
    
    let queryText = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (role) {
      queryText += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (isVerified !== undefined) {
      queryText += ` AND is_verified = $${paramCount}`;
      params.push(isVerified === 'true');
      paramCount++;
    }

    if (isActive !== undefined) {
      queryText += ` AND is_active = $${paramCount}`;
      params.push(isActive === 'true');
      paramCount++;
    }

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await query(queryText, params);
    res.json(result.rows);
  }),

  verifyUser: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    
    const result = await query(
      `UPDATE users SET is_verified = true WHERE id = $1 RETURNING *`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({ message: 'User verified successfully', user: result.rows[0] });
  }),

  deactivateUser: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    
    const result = await query(
      `UPDATE users SET is_active = false WHERE id = $1 RETURNING *`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({ message: 'User deactivated successfully', user: result.rows[0] });
  }),

  // Project Management
  getAllProjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, page = 1, limit = 20 } = req.query;
    
    let queryText = `
      SELECT p.*, u.name as student_name, u.email as student_email
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

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    queryText += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await query(queryText, params);
    res.json(result.rows);
  }),

  // Dispute Management
  getAllDisputes: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status } = req.query;
    
    let queryText = `
      SELECT d.*, p.title as project_title, 
             u1.name as raised_by_name, u2.name as resolved_by_name
      FROM disputes d
      LEFT JOIN projects p ON d.project_id = p.id
      LEFT JOIN users u1 ON d.raised_by = u1.id
      LEFT JOIN users u2 ON d.resolved_by = u2.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      queryText += ` AND d.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    queryText += ` ORDER BY d.created_at DESC`;

    const result = await query(queryText, params);
    res.json(result.rows);
  }),

  resolveDispute: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { disputeId } = req.params;
    const { resolution } = req.body;
    
    const result = await query(
      `UPDATE disputes 
       SET status = 'resolved', resolved_by = $1, resolution = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 RETURNING *`,
      [req.user!.id, resolution, disputeId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Dispute not found', 404);
    }

    res.json({ message: 'Dispute resolved successfully', dispute: result.rows[0] });
  }),

  // Analytics
  getDashboardStats: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'developer') as total_developers,
        (SELECT COUNT(*) FROM projects) as total_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'open') as open_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'in_progress') as in_progress_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'completed') as completed_projects,
        (SELECT COUNT(*) FROM proposals) as total_proposals,
        (SELECT COALESCE(SUM(commission_amount), 0) FROM payments WHERE status = 'completed') as total_commission
    `);

    res.json(stats.rows[0]);
  }),

  // Payments
  getAllPayments: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { status, page = 1, limit = 20 } = req.query;
    
    let queryText = `
      SELECT p.*, pr.title as project_title,
             u1.name as student_name, u2.name as developer_name
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

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    queryText += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit as string), offset);

    const result = await query(queryText, params);
    res.json(result.rows);
  })
};

