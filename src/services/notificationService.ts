import { query } from '../database/connection';
import { AppError } from '../middleware/errorHandler';

export class NotificationService {
  async getNotifications(userId: number, limit: number = 50, offset: number = 0) {
    const result = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  async getUnreadCount(userId: number) {
    const result = await query(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    return parseInt(result.rows[0].count);
  }

  async getNotificationsWithCounts(userId: number, limit: number = 50, offset: number = 0) {
    const notifications = await this.getNotifications(userId, limit, offset);
    const unreadCount = await this.getUnreadCount(userId);
    
    // Get total count
    const totalResult = await query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1`,
      [userId]
    );
    const totalCount = parseInt(totalResult.rows[0].count);

    return {
      notifications,
      unreadCount,
      totalCount
    };
  }

  async markAsRead(notificationId: number, userId: number) {
    // First verify the notification belongs to the user
    const checkResult = await query(
      `SELECT * FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    const result = await query(
      `UPDATE notifications SET is_read = true 
       WHERE id = $1 AND user_id = $2 
       RETURNING *`,
      [notificationId, userId]
    );

    return result.rows[0];
  }

  async markAllAsRead(userId: number) {
    const result = await query(
      `UPDATE notifications SET is_read = true 
       WHERE user_id = $1 AND is_read = false 
       RETURNING *`,
      [userId]
    );

    return {
      count: result.rowCount,
      message: 'All notifications marked as read'
    };
  }

  async deleteNotification(notificationId: number, userId: number) {
    // First verify the notification belongs to the user
    const checkResult = await query(
      `SELECT * FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (checkResult.rows.length === 0) {
      throw new AppError('Notification not found', 404);
    }

    await query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    return {
      message: 'Notification deleted successfully'
    };
  }
}

