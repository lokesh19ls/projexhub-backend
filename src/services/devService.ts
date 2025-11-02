import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

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
    const earningsResult = await query(
      `SELECT COALESCE(SUM(net_amount), 0) as total FROM payments 
       WHERE developer_id = $1 AND status = 'completed'`,
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

