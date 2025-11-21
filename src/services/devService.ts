import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';
import { createNotificationAndSendPush } from '../utils/fcm';

interface DeveloperHomeData {
  developer: {
    name: string;
    rating: number;
  };
  dashboard: {
    activeProjects: number;
    totalEarnings: number;
    proposalsSent: number;
    successRate: number;
  };
  quickActions: Array<{
    id: number;
    title: string;
    icon: string;
    color: string;
    action: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    timestamp: string;
    timeAgo: string;
  }>;
  unreadNotificationsCount: number;
}

export class DevService {
  async getDeveloperHomeData(userId: number): Promise<DeveloperHomeData> {
    // Get developer profile
    const devResult = await query(
      `SELECT name, rating FROM users WHERE id = $1`,
      [userId]
    );

    if (devResult.rows.length === 0) {
      throw new AppError('Developer not found', 404);
    }

    const developer = devResult.rows[0];

    // Get dashboard stats
    const dashboard = await this.getDashboardStats(userId);

    // Get quick actions (static for now)
    const quickActions = this.getQuickActions();

    // Get recent activity
    const recentActivity = await this.getRecentActivity(userId);

    // Get unread notifications count
    const unreadCount = await this.getUnreadCount(userId);

    return {
      developer: {
        name: developer.name,
        rating: parseFloat(developer.rating || '0.0')
      },
      dashboard,
      quickActions,
      recentActivity,
      unreadNotificationsCount: unreadCount
    };
  }

  private async getDashboardStats(userId: number) {
    // Active projects (projects where developer's proposal was accepted)
    const activeProjectsResult = await query(
      `SELECT COUNT(*) as count FROM projects 
       WHERE accepted_proposal_id IN (SELECT id FROM proposals WHERE developer_id = $1) 
       AND status IN ('in_progress', 'open')`,
      [userId]
    );

    // Total earnings
    // Include: 1) Completed payments (actual money received)
    // 2) Completed projects without completed payments (calculate from proposal price - 10% commission)
    const earningsResult = await query(
      `WITH completed_payments AS (
        SELECT project_id, SUM(net_amount) as total_net
        FROM payments 
        WHERE developer_id = $1 AND status = 'completed'
        GROUP BY project_id
      ),
      completed_projects_with_proposals AS (
        SELECT 
          pr.id as project_id,
          p.price * 0.9 as net_earnings,
          COALESCE(cp.total_net, 0) as paid_amount
        FROM projects pr
        JOIN proposals p ON pr.accepted_proposal_id = p.id
        LEFT JOIN completed_payments cp ON pr.id = cp.project_id
        WHERE p.developer_id = $1 
        AND pr.status = 'completed'
      )
      SELECT COALESCE(
        SUM(CASE 
          WHEN paid_amount > 0 THEN paid_amount
          ELSE net_earnings
        END), 0
      ) as total
      FROM completed_projects_with_proposals`,
      [userId]
    );

    // Proposals sent
    const proposalsResult = await query(
      `SELECT COUNT(*) as count FROM proposals WHERE developer_id = $1`,
      [userId]
    );

    // Success rate (accepted proposals / total proposals)
    const acceptedProposalsResult = await query(
      `SELECT COUNT(*) as count FROM proposals 
       WHERE developer_id = $1 AND status = 'accepted'`,
      [userId]
    );

    const totalProposals = parseInt(proposalsResult.rows[0].count);
    const acceptedProposals = parseInt(acceptedProposalsResult.rows[0].count);
    const successRate = totalProposals > 0 ? Math.round((acceptedProposals / totalProposals) * 100) : 0;

    return {
      activeProjects: parseInt(activeProjectsResult.rows[0].count),
      totalEarnings: parseFloat(earningsResult.rows[0].total),
      proposalsSent: totalProposals,
      successRate
    };
  }

  private getQuickActions() {
    return [
      { id: 1, title: 'Browse Projects', icon: 'search', color: 'blue', action: 'browse_projects' },
      { id: 2, title: 'My Earnings', icon: 'wallet', color: 'green', action: 'my_earnings' },
      { id: 3, title: 'Upload Files', icon: 'cloud-upload', color: 'purple', action: 'upload_files' },
      { id: 4, title: 'Withdraw', icon: 'money-send', color: 'pink', action: 'withdraw' }
    ];
  }

  private async getRecentActivity(userId: number) {
    const activities: any[] = [];

    // Recent proposals accepted
    const proposalsResult = await query(
      `SELECT p.id, p.title, pr.updated_at
       FROM proposals pr
       JOIN projects p ON pr.project_id = p.id
       WHERE pr.developer_id = $1 AND pr.status = 'accepted'
       ORDER BY pr.updated_at DESC
       LIMIT 3`,
      [userId]
    );

    proposalsResult.rows.forEach(row => {
      activities.push({
        id: `proposal_${row.id}`,
        type: 'proposal_accepted',
        title: 'Proposal accepted',
        description: row.title,
        icon: 'check-circle',
        color: 'green',
        timestamp: row.updated_at,
        timeAgo: this.getTimeAgo(row.updated_at)
      });
    });

    // Recent messages
    const messagesResult = await query(
      `SELECT cm.id, cm.message, u.name as sender_name, cm.created_at, p.id as project_id, p.title as project_title
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       JOIN projects p ON cm.project_id = p.id
       WHERE cm.receiver_id = $1
       ORDER BY cm.created_at DESC
       LIMIT 3`,
      [userId]
    );

    messagesResult.rows.forEach(row => {
      activities.push({
        id: `message_${row.id}`,
        type: 'new_message',
        title: 'New message received',
        description: `From ${row.sender_name}`,
        icon: 'chat-bubble',
        color: 'blue',
        timestamp: row.created_at,
        timeAgo: this.getTimeAgo(row.created_at)
      });
    });

    // Recent payments
    const paymentsResult = await query(
      `SELECT id, net_amount, created_at
       FROM payments
       WHERE developer_id = $1 AND status = 'completed'
       ORDER BY created_at DESC
       LIMIT 3`,
      [userId]
    );

    paymentsResult.rows.forEach(row => {
      activities.push({
        id: `payment_${row.id}`,
        type: 'payment_received',
        title: 'Payment received',
        description: `₹${parseFloat(row.net_amount).toLocaleString('en-IN')}`,
        icon: 'rupee',
        color: 'pink',
        timestamp: row.created_at,
        timeAgo: this.getTimeAgo(row.created_at)
      });
    });

    // Sort by timestamp and return top 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  private async getUnreadCount(userId: number) {
    const result = await query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return parseInt(result.rows[0].count);
  }

  async updateProjectProgress(
    projectId: number,
    developerId: number,
    data: {
      progressPercentage?: number;
      status?: string;
      progressNote?: string;
    }
  ) {
    // Verify developer is assigned to this project
    const projectResult = await query(
      `SELECT p.*, ap.developer_id
       FROM projects p
       LEFT JOIN proposals ap ON p.accepted_proposal_id = ap.id
       WHERE p.id = $1 AND ap.developer_id = $2`,
      [projectId, developerId]
    );

    if (projectResult.rows.length === 0) {
      throw new AppError('Project not found or you are not assigned to this project', 404);
    }

    const project = projectResult.rows[0];

    // Validate progress percentage (should be 0, 20, 50, or 100)
    if (data.progressPercentage !== undefined) {
      if (![0, 20, 50, 100].includes(data.progressPercentage)) {
        throw new AppError('Progress percentage must be 0, 20, 50, or 100', 400);
      }
    }

    // Validate status
    if (data.status && !['in_progress', 'completed'].includes(data.status)) {
      throw new AppError('Status must be in_progress or completed', 400);
    }

    // Auto-set status to completed if progress is 100
    let finalStatus = data.status;
    if (data.progressPercentage === 100 && !data.status) {
      finalStatus = 'completed';
    }

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (data.progressPercentage !== undefined) {
      updates.push(`progress_percentage = $${paramCount}`);
      params.push(data.progressPercentage);
      paramCount++;
    }

    if (finalStatus) {
      updates.push(`status = $${paramCount}`);
      params.push(finalStatus);
      paramCount++;
    }

    if (updates.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    params.push(projectId);
    
    // Update project
    const updateResult = await query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      params
    );

    const updatedProject = updateResult.rows[0];

    // Create notification for student
    let notificationTitle = 'Project Progress Updated';
    let notificationMessage = `Developer updated progress for "${project.title}"`;

    if (finalStatus === 'completed') {
      notificationTitle = 'Project Completed!';
      notificationMessage = `Developer marked "${project.title}" as completed`;
    } else if (data.progressPercentage === 100) {
      notificationTitle = 'Project Progress: 100%';
      notificationMessage = `Developer reached 100% progress for "${project.title}"`;
    } else if (data.progressPercentage === 50) {
      notificationTitle = 'Project Progress: 50%';
      notificationMessage = `Developer reached 50% milestone for "${project.title}"`;
    } else if (data.progressPercentage === 20) {
      notificationTitle = 'Project Progress: 20%';
      notificationMessage = `Developer reached 20% milestone for "${project.title}"`;
    } else if (finalStatus === 'in_progress') {
      notificationTitle = 'Project Status Updated';
      notificationMessage = `Developer set "${project.title}" to In Progress`;
    }

    // Create notification + push
    await createNotificationAndSendPush({
      userId: project.student_id,
      title: notificationTitle,
      message: notificationMessage,
      type: 'progress_update',
      relatedId: projectId,
      data: {
        projectId,
        developerId,
        progressPercentage: data.progressPercentage ?? updatedProject.progress_percentage,
        status: finalStatus || updatedProject.status,
        screen: 'project_progress'
      }
    });

    // Store progress history (if table exists)
    try {
      const progressPercentageToStore = data.progressPercentage !== undefined 
        ? data.progressPercentage 
        : updatedProject.progress_percentage;
      const statusToStore = finalStatus || updatedProject.status;

      await query(
        `INSERT INTO project_progress_history 
         (project_id, updated_by, progress_percentage, status, progress_note)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          projectId,
          developerId,
          progressPercentageToStore,
          statusToStore,
          data.progressNote || null
        ]
      );
    } catch (error: any) {
      // Table might not exist yet, log but don't fail
      if (error.code === '42P01') {
        console.warn('⚠️  project_progress_history table does not exist yet. Progress history will not be stored.');
      } else {
        // Re-throw other errors
        throw error;
      }
    }

    return {
      project: updatedProject,
      progressNote: data.progressNote || null,
      notification: {
        title: notificationTitle,
        message: notificationMessage
      }
    };
  }

  async browseProjects(developerId: number, filters: {
    status?: string;
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
             (SELECT COUNT(*) FROM proposals WHERE project_id = p.id) as proposals_count,
             (SELECT COUNT(*) FROM proposals WHERE project_id = p.id AND developer_id = $1) as has_applied,
             (SELECT id FROM proposals WHERE project_id = p.id AND developer_id = $1 LIMIT 1) as my_proposal_id
      FROM projects p
      LEFT JOIN users u ON p.student_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [developerId];
    let paramCount = 2;

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

  private getTimeAgo(timestamp: string): string {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      return time.toLocaleDateString();
    }
  }
}

