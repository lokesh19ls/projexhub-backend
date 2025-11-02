import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';
import { asyncHandler } from '../middleware/errorHandler';

const notificationService = new NotificationService();

export const notificationController = {
  getNotifications: asyncHandler(async (req: AuthRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const result = await notificationService.getNotificationsWithCounts(
      req.user!.id,
      limit,
      offset
    );
    
    res.json(result);
  }),

  markAsRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    const notificationId = parseInt(req.params.id);
    const notification = await notificationService.markAsRead(
      notificationId,
      req.user!.id
    );
    res.json({
      message: 'Notification marked as read',
      notification
    });
  }),

  markAllAsRead: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await notificationService.markAllAsRead(req.user!.id);
    res.json(result);
  }),

  deleteNotification: asyncHandler(async (req: AuthRequest, res: Response) => {
    const notificationId = parseInt(req.params.id);
    const result = await notificationService.deleteNotification(
      notificationId,
      req.user!.id
    );
    res.json(result);
  })
};

