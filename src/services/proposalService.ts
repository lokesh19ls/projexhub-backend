import { query } from '../database/connection';
import { CreateProposalDTO, Proposal, ProposalStatus } from '../models/Proposal';
import { AppError } from '../middleware/errorHandler';

export class ProposalService {
  async createProposal(projectId: number, developerId: number, data: CreateProposalDTO): Promise<Proposal> {
    // Check if project exists and is open
    const projectResult = await query(`SELECT * FROM projects WHERE id = $1`, [projectId]);
    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const project = projectResult.rows[0];
    if (project.status !== 'open') {
      throw new AppError('Project is not accepting proposals', 400);
    }

    // Check if developer already sent a proposal
    const existingProposal = await query(
      `SELECT * FROM proposals WHERE project_id = $1 AND developer_id = $2`,
      [projectId, developerId]
    );

    if (existingProposal.rows.length > 0) {
      throw new AppError('You have already sent a proposal for this project', 400);
    }

    // Create proposal
    const result = await query(
      `INSERT INTO proposals (project_id, developer_id, price, timeline, technology, message)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        projectId,
        developerId,
        data.price,
        data.timeline,
        data.technology || [],
        data.message || null
      ]
    );

    // Create notification for student
    await query(
      `INSERT INTO notifications (user_id, title, message, type, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        project.student_id,
        'New Proposal Received',
        `You received a new proposal for "${project.title}"`,
        'proposal',
        result.rows[0].id
      ]
    );

    return result.rows[0];
  }

  async getProposalById(proposalId: number) {
    const result = await query(
      `SELECT p.*, 
              d.id as developer_id, d.name as developer_name, d.rating, d.total_ratings, d.skills as developer_skills,
              pr.id as project_id, pr.title as project_title, pr.budget, pr.deadline
       FROM proposals p
       LEFT JOIN users d ON p.developer_id = d.id
       LEFT JOIN projects pr ON p.project_id = pr.id
       WHERE p.id = $1`,
      [proposalId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Proposal not found', 404);
    }

    return result.rows[0];
  }

  async getProjectProposals(projectId: number) {
    const result = await query(
      `SELECT p.*, 
              d.id as developer_id, d.name as developer_name, d.rating, d.total_ratings, d.skills
       FROM proposals p
       LEFT JOIN users d ON p.developer_id = d.id
       WHERE p.project_id = $1
       ORDER BY p.created_at DESC`,
      [projectId]
    );

    return result.rows;
  }

  async getUserProposals(userId: number) {
    const result = await query(
      `SELECT p.*, 
              pr.id as project_id, pr.title as project_title, pr.budget, pr.deadline, pr.status as project_status,
              s.id as student_id, s.name as student_name
       FROM proposals p
       LEFT JOIN projects pr ON p.project_id = pr.id
       LEFT JOIN users s ON pr.student_id = s.id
       WHERE p.developer_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async acceptProposal(proposalId: number, studentId: number) {
    // Get proposal with project details
    const proposal = await this.getProposalById(proposalId);
    
    // Verify ownership
    const projectResult = await query(`SELECT * FROM projects WHERE id = $1`, [proposal.project_id]);
    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const project = projectResult.rows[0];
    if (project.student_id !== studentId) {
      throw new AppError('Unauthorized to accept this proposal', 403);
    }

    // Update proposal status
    await query(
      `UPDATE proposals SET status = $1 WHERE id = $2`,
      [ProposalStatus.ACCEPTED, proposalId]
    );

    // Reject other proposals
    await query(
      `UPDATE proposals SET status = $1 WHERE project_id = $2 AND id != $3`,
      [ProposalStatus.REJECTED, proposal.project_id, proposalId]
    );

    // Update project
    await query(
      `UPDATE projects SET status = $1, accepted_proposal_id = $2 WHERE id = $3`,
      ['in_progress', proposalId, proposal.project_id]
    );

    // Create notification for developer
    await query(
      `INSERT INTO notifications (user_id, title, message, type, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        proposal.developer_id,
        'Proposal Accepted!',
        `Your proposal for "${project.title}" has been accepted`,
        'proposal_accepted',
        proposalId
      ]
    );

    return { message: 'Proposal accepted successfully' };
  }

  async rejectProposal(proposalId: number, studentId: number) {
    const proposal = await this.getProposalById(proposalId);
    
    const projectResult = await query(`SELECT * FROM projects WHERE id = $1`, [proposal.project_id]);
    const project = projectResult.rows[0];

    if (project.student_id !== studentId) {
      throw new AppError('Unauthorized to reject this proposal', 403);
    }

    await query(
      `UPDATE proposals SET status = $1 WHERE id = $2`,
      [ProposalStatus.REJECTED, proposalId]
    );

    return { message: 'Proposal rejected successfully' };
  }
}

