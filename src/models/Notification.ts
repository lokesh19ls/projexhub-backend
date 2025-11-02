export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  relatedId?: number;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationWithCounts {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

