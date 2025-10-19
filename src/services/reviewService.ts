import { query } from '../database/connection';
import { CreateReviewDTO } from '../models/Review';
import { AppError } from '../middleware/errorHandler';

export class ReviewService {
  async createReview(projectId: number, reviewerId: number, data: CreateReviewDTO) {
    // Get project details
    const projectResult = await query(
      `SELECT student_id, accepted_proposal_id,
              (SELECT developer_id FROM proposals WHERE id = accepted_proposal_id) as developer_id
       FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found', 404);
    }

    const project = projectResult.rows[0];

    // Determine reviewee
    const revieweeId = reviewerId === project.student_id ? project.developer_id : project.student_id;

    if (!revieweeId) {
      throw new AppError('No active developer for this project', 400);
    }

    // Check if review already exists
    const existingReview = await query(
      `SELECT * FROM reviews WHERE project_id = $1 AND reviewer_id = $2`,
      [projectId, reviewerId]
    );

    if (existingReview.rows.length > 0) {
      throw new AppError('You have already reviewed this project', 400);
    }

    // Create review
    const result = await query(
      `INSERT INTO reviews (project_id, reviewer_id, reviewee_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [projectId, reviewerId, revieweeId, data.rating, data.comment || null]
    );

    // Update user rating
    await this.updateUserRating(revieweeId);

    return result.rows[0];
  }

  private async updateUserRating(userId: number) {
    const result = await query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
       FROM reviews WHERE reviewee_id = $1`,
      [userId]
    );

    const { avg_rating, total_ratings } = result.rows[0];

    await query(
      `UPDATE users SET rating = $1, total_ratings = $2 WHERE id = $3`,
      [parseFloat(avg_rating).toFixed(2), parseInt(total_ratings), userId]
    );
  }

  async getReviews(userId: number) {
    const result = await query(
      `SELECT r.*, 
              reviewer.id as reviewer_id, reviewer.name as reviewer_name, reviewer.profile_photo,
              p.title as project_title
       FROM reviews r
       LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
       LEFT JOIN projects p ON r.project_id = p.id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  async getProjectReviews(projectId: number) {
    const result = await query(
      `SELECT r.*, 
              reviewer.id as reviewer_id, reviewer.name as reviewer_name, reviewer.profile_photo
       FROM reviews r
       LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
       WHERE r.project_id = $1
       ORDER BY r.created_at DESC`,
      [projectId]
    );

    return result.rows;
  }
}

