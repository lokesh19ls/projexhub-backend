import { query } from '../database/connection';
import { CreateProjectDTO, UpdateProjectDTO, Project, ProjectStatus } from '../models/Project';
import { AppError } from '../middleware/errorHandler';

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
}

