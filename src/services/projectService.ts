import { query } from '../database/connection';
import { CreateProjectDTO, UpdateProjectDTO, Project, ProjectStatus } from '../models/Project';
import { AppError } from '../middleware/errorHandler';
import { ProjectFile } from '../models/ProjectFile';

export class ProjectService {
  async createProject(studentId: number, data: CreateProjectDTO): Promise<Project> {
    const result = await query(
      `INSERT INTO projects (student_id, title, description, technology, budget, deadline)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        studentId,
        data.title,
        data.description,
        data.technology,
        data.budget,
        data.deadline
      ]
    );

    return result.rows[0];
  }

  async getProjectById(projectId: number, _userId?: number) {
    const result = await query(
      `SELECT p.*, 
              u.id as student_id, u.name as student_name, u.college, u.department,
              ap.id as proposal_id, ap.price, ap.timeline,
              d.id as developer_id, d.name as developer_name, d.rating as developer_rating
       FROM projects p
       LEFT JOIN users u ON p.student_id = u.id
       LEFT JOIN proposals ap ON p.accepted_proposal_id = ap.id
       LEFT JOIN users d ON ap.developer_id = d.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const project = result.rows[0];

    // Get proposals count
    const proposalsResult = await query(
      `SELECT COUNT(*) as count FROM proposals WHERE project_id = $1`,
      [projectId]
    );
    project.proposals_count = parseInt(proposalsResult.rows[0].count);

    return project;
  }

  async getProjects(filters: {
    status?: ProjectStatus;
    technology?: string;
    minBudget?: number;
    maxBudget?: number;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    let queryText = `
      SELECT p.*, 
             u.id as student_id, u.name as student_name, u.college, u.department,
             (SELECT COUNT(*) FROM proposals WHERE project_id = p.id) as proposals_count
      FROM projects p
      LEFT JOIN users u ON p.student_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (filters.status) {
      queryText += ` AND p.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.technology) {
      queryText += ` AND $${paramCount} = ANY(p.technology)`;
      params.push(filters.technology);
      paramCount++;
    }

    if (filters.minBudget) {
      queryText += ` AND p.budget >= $${paramCount}`;
      params.push(filters.minBudget);
      paramCount++;
    }

    if (filters.maxBudget) {
      queryText += ` AND p.budget <= $${paramCount}`;
      params.push(filters.maxBudget);
      paramCount++;
    }

    if (filters.search) {
      queryText += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    queryText += ` ORDER BY p.created_at DESC`;

    if (filters.limit) {
      queryText += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      queryText += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
      paramCount++;
    }

    const result = await query(queryText, params);
    return result.rows;
  }

  async updateProject(projectId: number, studentId: number, data: UpdateProjectDTO) {
    // Verify ownership
    const project = await this.getProjectById(projectId);
    if (project.student_id !== studentId) {
      throw new AppError('Unauthorized to update this project', 403);
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (data.title) {
      updates.push(`title = $${paramCount}`);
      params.push(data.title);
      paramCount++;
    }
    if (data.description) {
      updates.push(`description = $${paramCount}`);
      params.push(data.description);
      paramCount++;
    }
    if (data.technology) {
      updates.push(`technology = $${paramCount}`);
      params.push(data.technology);
      paramCount++;
    }
    if (data.budget) {
      updates.push(`budget = $${paramCount}`);
      params.push(data.budget);
      paramCount++;
    }
    if (data.deadline) {
      updates.push(`deadline = $${paramCount}`);
      params.push(data.deadline);
      paramCount++;
    }
    if (data.status) {
      updates.push(`status = $${paramCount}`);
      params.push(data.status);
      paramCount++;
    }
    if (data.progressPercentage !== undefined) {
      updates.push(`progress_percentage = $${paramCount}`);
      params.push(data.progressPercentage);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    params.push(projectId);
    const result = await query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    return result.rows[0];
  }

  async deleteProject(projectId: number, studentId: number) {
    // Verify ownership
    const project = await this.getProjectById(projectId);
    if (project.student_id !== studentId) {
      throw new AppError('Unauthorized to delete this project', 403);
    }

    await query(`DELETE FROM projects WHERE id = $1`, [projectId]);
    return { message: 'Project deleted successfully' };
  }

  async getUserProjects(userId: number, role: string) {
    const column = role === 'student' ? 'student_id' : 'accepted_proposal_id';
    
    const result = await query(
      `SELECT p.*, 
              u.id as student_id, u.name as student_name,
              (SELECT COUNT(*) FROM proposals WHERE project_id = p.id) as proposals_count
       FROM projects p
       LEFT JOIN users u ON p.student_id = u.id
       WHERE p.${column} = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async getProjectProgressTracking(projectId: number, studentId: number) {
    // Verify student owns the project
    const projectResult = await query(
      `SELECT p.*, 
              ap.id as proposal_id, ap.price, ap.timeline,
              d.id as developer_id, d.name as developer_name, d.email as developer_email, 
              d.rating as developer_rating, d.profile_photo as developer_photo
       FROM projects p
       LEFT JOIN proposals ap ON p.accepted_proposal_id = ap.id
       LEFT JOIN users d ON ap.developer_id = d.id
       WHERE p.id = $1 AND p.student_id = $2`,
      [projectId, studentId]
    );

    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found or unauthorized', 404);
    }

    const project = projectResult.rows[0];

    // Get progress history (sorted by most recent first)
    // Handle case where table might not exist yet
    let progressHistory: any[] = [];
    try {
      const historyResult = await query(
        `SELECT pph.*, u.name as updated_by_name
         FROM project_progress_history pph
         LEFT JOIN users u ON pph.updated_by = u.id
         WHERE pph.project_id = $1
         ORDER BY pph.created_at DESC`,
        [projectId]
      );

      progressHistory = historyResult.rows.map((row: any) => ({
      id: row.id,
      progressPercentage: row.progress_percentage,
      status: row.status,
      progressNote: row.progress_note,
      updatedBy: {
        id: row.updated_by,
        name: row.updated_by_name
      },
      createdAt: row.created_at
      }));
    } catch (error: any) {
      // Table might not exist yet, return empty history
      if (error.code === '42P01') {
        progressHistory = [];
      } else {
        throw error;
      }
    }

    // Calculate milestone completion
    const milestones = [
      { percentage: 20, label: '20% Milestone', completed: false, completedAt: null as Date | null, note: null as string | null },
      { percentage: 50, label: '50% Milestone', completed: false, completedAt: null as Date | null, note: null as string | null },
      { percentage: 100, label: '100% Complete', completed: false, completedAt: null as Date | null, note: null as string | null }
    ];

    // Mark completed milestones and get completion dates/notes
    for (const milestone of milestones) {
      const milestoneHistory = progressHistory.find(
        (h) => h.progressPercentage === milestone.percentage
      );
      if (milestoneHistory) {
        milestone.completed = true;
        milestone.completedAt = milestoneHistory.createdAt;
        milestone.note = milestoneHistory.progressNote;
      }
    }

    // Calculate timeline information
    const projectStartDate = project.created_at;
    const projectDeadline = project.deadline;
    const proposal = project.proposal_id ? {
      timeline: project.timeline,
      price: project.price
    } : null;

    // Calculate days elapsed and days remaining
    const now = new Date();
    const startDate = new Date(projectStartDate);
    const deadlineDate = new Date(projectDeadline);
    const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = proposal ? proposal.timeline : null;
    const daysOverdue = daysRemaining < 0 ? Math.abs(daysRemaining) : 0;

    return {
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        progressPercentage: project.progress_percentage,
        deadline: project.deadline,
        createdAt: project.created_at,
        updatedAt: project.updated_at
      },
      developer: project.developer_id ? {
        id: project.developer_id,
        name: project.developer_name,
        email: project.developer_email,
        rating: project.developer_rating,
        photo: project.developer_photo
      } : null,
      proposal: proposal,
      milestones,
      progressHistory,
      timeline: {
        startDate: projectStartDate,
        deadline: projectDeadline,
        daysElapsed,
        daysRemaining,
        totalDays,
        daysOverdue,
        isOverdue: daysRemaining < 0
      },
      currentProgress: {
        percentage: project.progress_percentage,
        status: project.status,
        latestUpdate: progressHistory.length > 0 ? progressHistory[0].createdAt : project.updated_at,
        latestNote: progressHistory.length > 0 ? progressHistory[0].progressNote : null
      }
    };
  }

  async uploadProjectFile(
    projectId: number,
    userId: number,
    userRole: string,
    file: Express.Multer.File,
    data: {
      milestonePercentage: number;
      description?: string;
    }
  ): Promise<ProjectFile> {
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    // Verify project and access
    const projectResult = await query(
      `SELECT p.id, p.student_id,
              ap.developer_id
       FROM projects p
       LEFT JOIN proposals ap ON p.accepted_proposal_id = ap.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const project = projectResult.rows[0];

    // Only assigned developer or admin can upload files
    if (userRole === 'developer') {
      if (project.developer_id !== userId) {
        throw new AppError('You are not assigned to this project', 403);
      }
    } else if (userRole !== 'admin') {
      throw new AppError('Only developer or admin can upload files', 403);
    }

    const fileUrl = `/uploads/${file.filename}`;
    const fileType = file.mimetype || 'application/octet-stream';

    const result = await query(
      `INSERT INTO project_files 
         (project_id, uploaded_by, file_url, file_name, file_type, milestone_percentage, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        projectId,
        userId,
        fileUrl,
        file.originalname,
        fileType,
        data.milestonePercentage,
        data.description || null
      ]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      projectId: row.project_id,
      uploadedBy: row.uploaded_by,
      fileUrl: row.file_url,
      fileName: row.file_name,
      fileType: row.file_type,
      milestonePercentage: row.milestone_percentage,
      description: row.description,
      createdAt: row.created_at
    };
  }

  async getProjectFiles(
    projectId: number,
    userId: number,
    userRole: string
  ): Promise<any[]> {
    // Verify project and access
    const projectResult = await query(
      `SELECT p.id, p.student_id,
              ap.developer_id
       FROM projects p
       LEFT JOIN proposals ap ON p.accepted_proposal_id = ap.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const project = projectResult.rows[0];

    if (
      userRole !== 'admin' &&
      userId !== project.student_id &&
      userId !== project.developer_id
    ) {
      throw new AppError('Unauthorized to view project files', 403);
    }

    const result = await query(
      `SELECT pf.*, u.name as uploaded_by_name
       FROM project_files pf
       LEFT JOIN users u ON pf.uploaded_by = u.id
       WHERE pf.project_id = $1
       ORDER BY pf.created_at DESC`,
      [projectId]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      projectId: row.project_id,
      uploadedBy: {
        id: row.uploaded_by,
        name: row.uploaded_by_name
      },
      fileUrl: row.file_url,
      fileName: row.file_name,
      fileType: row.file_type,
      milestonePercentage: row.milestone_percentage,
      description: row.description,
      createdAt: row.created_at
    }));
  }

  async deleteProjectFile(
    projectId: number,
    fileId: number,
    userId: number,
    userRole: string
  ): Promise<void> {
    const result = await query(
      `SELECT pf.*, p.student_id,
              ap.developer_id
       FROM project_files pf
       JOIN projects p ON pf.project_id = p.id
       LEFT JOIN proposals ap ON p.accepted_proposal_id = ap.id
       WHERE pf.id = $1 AND pf.project_id = $2`,
      [fileId, projectId]
    );

    if (result.rows.length === 0) {
      throw new AppError('File not found for this project', 404);
    }

    const file = result.rows[0];

    // Only admin or the uploader (who is also the assigned developer) can delete
    if (userRole === 'admin') {
      // allowed
    } else if (userRole === 'developer') {
      if (file.developer_id !== userId || file.uploaded_by !== userId) {
        throw new AppError('You are not allowed to delete this file', 403);
      }
    } else {
      throw new AppError('Only developer or admin can delete files', 403);
    }

    await query(
      `DELETE FROM project_files WHERE id = $1`,
      [fileId]
    );
  }
}

