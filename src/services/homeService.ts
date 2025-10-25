import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

export class HomeService {
  async getHomeData(userId: number, userRole: string) {
    try {
      // Get user profile
      const userResult = await query(
        `SELECT id, name, email, role, college, department, year_of_study, skills, bio, profile_photo, is_verified, rating, total_ratings
         FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = userResult.rows[0];

      // Get dashboard metrics based on user role
      let dashboardMetrics;
      if (userRole === 'student') {
        dashboardMetrics = await this.getStudentDashboardMetrics(userId);
      } else if (userRole === 'developer') {
        dashboardMetrics = await this.getDeveloperDashboardMetrics(userId);
      } else {
        dashboardMetrics = await this.getAdminDashboardMetrics(userId);
      }

      // Get recent activity
      const recentActivity = await this.getRecentActivity(userId, userRole);

      // Quick actions (static for now, can be customized per role)
      const quickActions = this.getQuickActions(userRole);

      return {
        user: {
          name: user.name,
          college: user.college,
          role: user.role
        },
        dashboardMetrics,
        recentActivity,
        quickActions
      };
    } catch (error) {
      throw error;
    }
  }

  private async getStudentDashboardMetrics(userId: number) {
    // Active projects count
    const activeProjectsResult = await query(
      `SELECT COUNT(*) as count FROM projects WHERE student_id = $1 AND status = 'open'`,
      [userId]
    );

    // Total proposals received for student's projects
    const proposalsResult = await query(
      `SELECT COUNT(*) as count FROM proposals 
       WHERE project_id IN (SELECT id FROM projects WHERE student_id = $1)`,
      [userId]
    );

    // Messages count (unread)
    const messagesResult = await query(
      `SELECT COUNT(DISTINCT project_id) as count FROM chat_messages 
       WHERE receiver_id = $1 AND is_read = false`,
      [userId]
    );

    // Completed projects count
    const completedProjectsResult = await query(
      `SELECT COUNT(*) as count FROM projects WHERE student_id = $1 AND status = 'completed'`,
      [userId]
    );

    return {
      activeProjects: parseInt(activeProjectsResult.rows[0].count),
      proposals: parseInt(proposalsResult.rows[0].count),
      messages: parseInt(messagesResult.rows[0].count),
      completed: parseInt(completedProjectsResult.rows[0].count)
    };
  }

  private async getDeveloperDashboardMetrics(userId: number) {
    // Active projects (projects where developer's proposal was accepted)
    const activeProjectsResult = await query(
      `SELECT COUNT(*) as count FROM projects 
       WHERE accepted_proposal_id IN (SELECT id FROM proposals WHERE developer_id = $1) 
       AND status IN ('in_progress', 'open')`,
      [userId]
    );

    // Total proposals sent by developer
    const proposalsResult = await query(
      `SELECT COUNT(*) as count FROM proposals WHERE developer_id = $1`,
      [userId]
    );

    // Messages count (unread)
    const messagesResult = await query(
      `SELECT COUNT(DISTINCT project_id) as count FROM chat_messages 
       WHERE receiver_id = $1 AND is_read = false`,
      [userId]
    );

    // Completed projects count
    const completedProjectsResult = await query(
      `SELECT COUNT(*) as count FROM projects 
       WHERE accepted_proposal_id IN (SELECT id FROM proposals WHERE developer_id = $1) 
       AND status = 'completed'`,
      [userId]
    );

    return {
      activeProjects: parseInt(activeProjectsResult.rows[0].count),
      proposals: parseInt(proposalsResult.rows[0].count),
      messages: parseInt(messagesResult.rows[0].count),
      completed: parseInt(completedProjectsResult.rows[0].count)
    };
  }

  private async getAdminDashboardMetrics(_userId: number) {
    // Total active projects in system
    const activeProjectsResult = await query(
      `SELECT COUNT(*) as count FROM projects WHERE status = 'open'`
    );

    // Total proposals in system
    const proposalsResult = await query(
      `SELECT COUNT(*) as count FROM proposals WHERE status = 'pending'`
    );

    // Total messages in system
    const messagesResult = await query(
      `SELECT COUNT(*) as count FROM chat_messages WHERE is_read = false`
    );

    // Total completed projects
    const completedProjectsResult = await query(
      `SELECT COUNT(*) as count FROM projects WHERE status = 'completed'`
    );

    return {
      activeProjects: parseInt(activeProjectsResult.rows[0].count),
      proposals: parseInt(proposalsResult.rows[0].count),
      messages: parseInt(messagesResult.rows[0].count),
      completed: parseInt(completedProjectsResult.rows[0].count)
    };
  }

  private async getRecentActivity(userId: number, userRole: string) {
    const activities: any[] = [];

    if (userRole === 'student') {
      // Recent proposals received
      const proposalsResult = await query(
        `SELECT p.id, p.project_id, pr.title, p.created_at, d.name as developer_name
         FROM proposals p
         JOIN projects pr ON p.project_id = pr.id
         JOIN users d ON p.developer_id = d.id
         WHERE pr.student_id = $1
         ORDER BY p.created_at DESC
         LIMIT 5`,
        [userId]
      );

      proposalsResult.rows.forEach(row => {
        activities.push({
          id: `proposal_${row.id}`,
          type: 'proposal_received',
          title: 'New proposal received',
          message: row.title,
          icon: 'handshake',
          color: 'green',
          timestamp: row.created_at,
          time_ago: this.getTimeAgo(row.created_at)
        });
      });

      // Recent messages
      const messagesResult = await query(
        `SELECT cm.id, cm.project_id, p.title, cm.sender_id, u.name as sender_name, cm.created_at
         FROM chat_messages cm
         JOIN projects p ON cm.project_id = p.id
         JOIN users u ON cm.sender_id = u.id
         WHERE cm.receiver_id = $1
         ORDER BY cm.created_at DESC
         LIMIT 5`,
        [userId]
      );

      messagesResult.rows.forEach(row => {
        activities.push({
          id: `message_${row.id}`,
          type: 'message_received',
          title: 'Developer replied',
          message: row.sender_name,
          icon: 'chat',
          color: 'blue',
          timestamp: row.created_at,
          time_ago: this.getTimeAgo(row.created_at)
        });
      });

    } else if (userRole === 'developer') {
      // Recent proposals sent
      const proposalsResult = await query(
        `SELECT p.id, p.project_id, pr.title, p.status, p.created_at
         FROM proposals p
         JOIN projects pr ON p.project_id = pr.id
         WHERE p.developer_id = $1
         ORDER BY p.created_at DESC
         LIMIT 5`,
        [userId]
      );

      proposalsResult.rows.forEach(row => {
        activities.push({
          id: `proposal_${row.id}`,
          type: row.status === 'accepted' ? 'proposal_accepted' : 'proposal_sent',
          title: row.status === 'accepted' ? 'Proposal accepted' : 'Proposal sent',
          message: row.title,
          icon: 'handshake',
          color: row.status === 'accepted' ? 'green' : 'purple',
          timestamp: row.created_at,
          time_ago: this.getTimeAgo(row.created_at)
        });
      });

      // Recent messages
      const messagesResult = await query(
        `SELECT cm.id, cm.project_id, p.title, cm.sender_id, u.name as sender_name, cm.created_at
         FROM chat_messages cm
         JOIN projects p ON cm.project_id = p.id
         JOIN users u ON cm.sender_id = u.id
         WHERE cm.receiver_id = $1
         ORDER BY cm.created_at DESC
         LIMIT 5`,
        [userId]
      );

      messagesResult.rows.forEach(row => {
        activities.push({
          id: `message_${row.id}`,
          type: 'message_received',
          title: 'Student replied',
          message: row.sender_name,
          icon: 'chat',
          color: 'blue',
          timestamp: row.created_at,
          time_ago: this.getTimeAgo(row.created_at)
        });
      });
    }

    // Sort by timestamp and return top 10
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  }

  private getQuickActions(userRole: string) {
    if (userRole === 'student') {
      return [
        { id: 1, title: 'Post New Project', icon: 'plus', color: 'purple', action: 'post_project' },
        { id: 2, title: 'AI Project Ideas', icon: 'sparkles', color: 'purple', action: 'ai_ideas' },
        { id: 3, title: 'Browse Developers', icon: 'users', color: 'green', action: 'browse_developers' },
        { id: 4, title: 'View Reports', icon: 'chart', color: 'pink', action: 'view_reports' }
      ];
    } else if (userRole === 'developer') {
      return [
        { id: 1, title: 'Browse Projects', icon: 'folder', color: 'purple', action: 'browse_projects' },
        { id: 2, title: 'My Proposals', icon: 'handshake', color: 'purple', action: 'my_proposals' },
        { id: 3, title: 'My Earnings', icon: 'dollar', color: 'green', action: 'my_earnings' },
        { id: 4, title: 'View Reports', icon: 'chart', color: 'pink', action: 'view_reports' }
      ];
    } else {
      return [
        { id: 1, title: 'Dashboard', icon: 'dashboard', color: 'purple', action: 'dashboard' },
        { id: 2, title: 'Manage Users', icon: 'users', color: 'purple', action: 'manage_users' },
        { id: 3, title: 'View Disputes', icon: 'alert', color: 'green', action: 'view_disputes' },
        { id: 4, title: 'Analytics', icon: 'chart', color: 'pink', action: 'analytics' }
      ];
    }
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
    } else {
      return time.toLocaleDateString();
    }
  }
}

