# 🔔 ProjexHub Notification API Documentation

**Base URL:** `https://projexhub-backend.onrender.com/api`

---

## 🔐 Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## 📋 API Endpoints

### 1. Get Notifications

**Endpoint:** `GET /api/notifications`

**Description:** Retrieve all notifications for the authenticated user with unread count and pagination.

**Query Parameters:**
- `limit` (number, optional) - Number of results to return (default: 50, max: 100)
- `offset` (number, optional) - Number of results to skip (default: 0)

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Request with Pagination:**
```bash
curl -X GET "https://projexhub-backend.onrender.com/api/notifications?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": 1,
      "user_id": 2,
      "title": "New Message",
      "message": "You have a new message for project",
      "type": "message",
      "related_id": 5,
      "is_read": false,
      "created_at": "2025-01-20T10:30:00.000Z"
    },
    {
      "id": 2,
      "user_id": 2,
      "title": "New Proposal Received",
      "message": "You received a new proposal for \"E-commerce Website\"",
      "type": "proposal",
      "related_id": 3,
      "is_read": false,
      "created_at": "2025-01-20T09:15:00.000Z"
    },
    {
      "id": 3,
      "user_id": 2,
      "title": "Proposal Accepted!",
      "message": "Your proposal for \"Mobile App\" has been accepted",
      "type": "proposal_accepted",
      "related_id": 2,
      "is_read": true,
      "created_at": "2025-01-19T14:00:00.000Z"
    }
  ],
  "unreadCount": 2,
  "totalCount": 3
}
```

**Response Fields:**
- `notifications` - Array of notification objects
  - `id` - Notification ID
  - `user_id` - User ID who received the notification
  - `title` - Notification title
  - `message` - Notification message
  - `type` - Notification type (message, proposal, proposal_accepted, payment, etc.)
  - `related_id` - ID of related entity (project ID, proposal ID, etc.)
  - `is_read` - Read status (true/false)
  - `created_at` - Timestamp when notification was created
- `unreadCount` - Number of unread notifications
- `totalCount` - Total number of notifications

---

### 2. Mark Notification as Read

**Endpoint:** `PUT /api/notifications/:id/read`

**Description:** Mark a specific notification as read.

**URL Parameters:**
- `id` (number) - The notification ID

**Example Request:**
```bash
curl -X PUT https://projexhub-backend.onrender.com/api/notifications/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": 1,
    "user_id": 2,
    "title": "New Message",
    "message": "You have a new message for project",
    "type": "message",
    "related_id": 5,
    "is_read": true,
    "created_at": "2025-01-20T10:30:00.000Z"
  }
}
```

**Error Responses:**

**404 Not Found**
```json
{
  "error": "Notification not found"
}
```

**Note:** Users can only mark their own notifications as read.

---

### 3. Mark All Notifications as Read

**Endpoint:** `PUT /api/notifications/read/all`

**Description:** Mark all unread notifications as read for the authenticated user.

**Example Request:**
```bash
curl -X PUT https://projexhub-backend.onrender.com/api/notifications/read/all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "count": 5,
  "message": "All notifications marked as read"
}
```

**Response Fields:**
- `count` - Number of notifications marked as read
- `message` - Success message

---

### 4. Delete Notification

**Endpoint:** `DELETE /api/notifications/:id`

**Description:** Delete a specific notification.

**URL Parameters:**
- `id` (number) - The notification ID

**Example Request:**
```bash
curl -X DELETE https://projexhub-backend.onrender.com/api/notifications/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "message": "Notification deleted successfully"
}
```

**Error Responses:**

**404 Not Found**
```json
{
  "error": "Notification not found"
}
```

**Note:** Users can only delete their own notifications.

---

## 📝 Notification Types

The system automatically creates notifications for various events:

| Type | Trigger | Description |
|------|---------|-------------|
| `message` | New chat message | User receives a new message in project chat |
| `proposal` | New proposal | Student receives a new proposal for their project |
| `proposal_accepted` | Proposal accepted | Developer's proposal was accepted by student |
| `payment` | Payment received | Developer receives payment notification |
| `payment_completed` | Payment completed | Student receives payment confirmation |
| `project_accepted` | Project started | Developer's proposal accepted, project started |
| `review` | New review | User receives a review on their profile |

---

## 🔔 Automatic Notifications

The system automatically creates notifications for:

### Chat Messages
- **When:** User sends a message to project chat
- **Who Gets:** Receiver of the message
- **Type:** `message`
- **Related ID:** Project ID

### Proposals
- **When:** Developer sends a proposal
- **Who Gets:** Student (project owner)
- **Type:** `proposal`
- **Related ID:** Proposal ID

### Proposal Accepted
- **When:** Student accepts a proposal
- **Who Gets:** Developer whose proposal was accepted
- **Type:** `proposal_accepted`
- **Related ID:** Proposal ID

### Payments
- **When:** Payment is verified and completed
- **Who Gets:** Developer receiving payment
- **Type:** `payment`
- **Related ID:** Payment ID

---

## 🔐 Authorization & Access Control

### Rules

1. **Authentication Required:** All endpoints require valid JWT token
2. **User Ownership:** Users can only access their own notifications
3. **Security:** Cannot modify or delete other users' notifications
4. **Validation:** Proper checks for notification existence and ownership

### Access Matrix

| Endpoint | Student | Developer | Admin |
|----------|---------|-----------|-------|
| Get Notifications | ✅ | ✅ | ✅ |
| Mark as Read | ✅ | ✅ | ✅ |
| Mark All as Read | ✅ | ✅ | ✅ |
| Delete Notification | ✅ | ✅ | ✅ |

---

## 📊 Usage Examples

### Get First 20 Notifications
```bash
curl -X GET "https://projexhub-backend.onrender.com/api/notifications?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Mark Notification as Read
```bash
curl -X PUT https://projexhub-backend.onrender.com/api/notifications/5/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Mark All as Read
```bash
curl -X PUT https://projexhub-backend.onrender.com/api/notifications/read/all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Delete a Notification
```bash
curl -X DELETE https://projexhub-backend.onrender.com/api/notifications/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔄 Integration with Chat API

When a chat message is sent, a notification is automatically created:

```javascript
// Send message
const response = await fetch('/api/chat/project/1/message', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'multipart/form-data'
  },
  body: formData
});

// Automatically creates notification for receiver
// User can then fetch notifications:
const notifications = await fetch('/api/notifications', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## 🔔 Frontend Integration Example

### React/React Native Example

```javascript
import React, { useState, useEffect } from 'react';

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setUnreadCount(data.unreadCount);
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchNotifications(); // Refresh list
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read/all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchNotifications(); // Refresh list
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div>
      <button onClick={markAllAsRead}>
        Mark All Read
      </button>
      {notifications.map(notification => (
        <div
          key={notification.id}
          onClick={() => markAsRead(notification.id)}
          className={notification.is_read ? 'read' : 'unread'}
        >
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <span>{new Date(notification.created_at).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
```

---

## 🧪 Testing

### Test with cURL

**1. Get all notifications:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**2. Mark notification as read:**
```bash
curl -X PUT https://projexhub-backend.onrender.com/api/notifications/1/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. Mark all as read:**
```bash
curl -X PUT https://projexhub-backend.onrender.com/api/notifications/read/all \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**4. Delete notification:**
```bash
curl -X DELETE https://projexhub-backend.onrender.com/api/notifications/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Common Errors

| Error | Status Code | Cause | Solution |
|-------|-------------|-------|----------|
| Notification not found | 404 | Invalid notification ID | Check notification ID exists |
| Unauthorized | 401 | Invalid/missing token | Provide valid JWT token |
| Forbidden | 403 | Accessing other user's notifications | Can only access own notifications |
| Bad Request | 400 | Invalid query parameters | Check limit and offset values |

---

## 📈 Best Practices

1. **Polling:** Fetch notifications periodically (e.g., every 30 seconds)
2. **Pagination:** Use limit/offset for large notification lists
3. **Auto-Read:** Mark as read when user views notification
4. **Cleanup:** Delete old read notifications periodically
5. **WebSocket:** Consider Socket.IO for real-time notifications
6. **Cache:** Cache notifications locally to reduce API calls

---

## 🔗 Related Endpoints

- `GET /api/chat/project/:projectId/messages` - Chat messages
- `GET /api/proposals/project/:projectId` - Project proposals
- `GET /api/payments/history` - Payment history
- `GET /api/home` - Home dashboard (includes notification count)

---

## 🎯 Implementation Notes

### Automatic Notification Creation

Notifications are automatically created by:
- **Chat Service:** When messages are sent
- **Proposal Service:** When proposals are sent/accepted
- **Payment Service:** When payments are verified

### Database

- Notifications stored in `notifications` table
- Indexed on `user_id` for fast retrieval
- Cascade delete when user is deleted

### Real-time Updates (Future)

Consider implementing Socket.IO for real-time notifications:
```javascript
socket.on('notification', (notification) => {
  // Update UI with new notification
  updateNotificationList(notification);
});
```

---

## 📞 Support

**Live API:** https://projexhub-backend.onrender.com/api  
**Documentation:** See `API_DOCUMENTATION.md`  
**For issues:** support@projexhub.com

---

**Last Updated:** January 2, 2025

