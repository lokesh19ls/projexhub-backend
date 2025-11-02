# 👨‍💻 Developer Home API Documentation

**Base URL:** `https://projexhub-backend.onrender.com/api`

---

## 🔐 Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## 📋 API Endpoint

### Get Developer Home Data

**Endpoint:** `GET /api/dev/home`

**Description:** Retrieve all data needed for the developer home screen, including dashboard metrics, quick actions, recent activity, and notifications count.

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/dev/home \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "developer": {
    "name": "Bob Developer",
    "rating": 4.5
  },
  "dashboard": {
    "activeProjects": 5,
    "totalEarnings": 120000,
    "proposalsSent": 15,
    "successRate": 85
  },
  "quickActions": [
    {
      "id": 1,
      "title": "Browse Projects",
      "icon": "search",
      "color": "blue",
      "action": "browse_projects"
    },
    {
      "id": 2,
      "title": "My Earnings",
      "icon": "wallet",
      "color": "green",
      "action": "my_earnings"
    },
    {
      "id": 3,
      "title": "Upload Files",
      "icon": "cloud-upload",
      "color": "purple",
      "action": "upload_files"
    },
    {
      "id": 4,
      "title": "Withdraw",
      "icon": "money-send",
      "color": "pink",
      "action": "withdraw"
    }
  ],
  "recentActivity": [
    {
      "id": "proposal_123",
      "type": "proposal_accepted",
      "title": "Proposal accepted",
      "description": "E-commerce Mobile App",
      "icon": "check-circle",
      "color": "green",
      "timestamp": "2025-01-20T08:00:00.000Z",
      "timeAgo": "1 hour ago"
    },
    {
      "id": "message_456",
      "type": "new_message",
      "title": "New message received",
      "description": "From John Doe",
      "icon": "chat-bubble",
      "color": "blue",
      "timestamp": "2025-01-20T06:00:00.000Z",
      "timeAgo": "3 hours ago"
    },
    {
      "id": "payment_789",
      "type": "payment_received",
      "title": "Payment received",
      "description": "₹25,000",
      "icon": "rupee",
      "color": "pink",
      "timestamp": "2025-01-19T09:00:00.000Z",
      "timeAgo": "1 day ago"
    }
  ],
  "unreadNotificationsCount": 2
}
```

**Response Fields:**

### Developer Info
- `name` - Developer's name
- `rating` - Average rating (0.0 to 5.0)

### Dashboard Metrics
- `activeProjects` - Number of projects currently in progress (status: in_progress or open)
- `totalEarnings` - Total earnings in INR from completed payments
- `proposalsSent` - Total number of proposals sent
- `successRate` - Percentage of proposals that were accepted (0-100)

### Quick Actions
Array of 4 quick action buttons:
- `id` - Action ID
- `title` - Action title
- `icon` - Icon identifier
- `color` - Theme color (blue, green, purple, pink)
- `action` - Action identifier for navigation

### Recent Activity
Array of recent activities (max 10):
- `id` - Activity ID
- `type` - Activity type (proposal_accepted, new_message, payment_received)
- `title` - Activity title
- `description` - Activity description
- `icon` - Icon identifier
- `color` - Theme color
- `timestamp` - ISO timestamp
- `timeAgo` - Human-readable time (e.g., "1 hour ago")

### Notifications
- `unreadNotificationsCount` - Count of unread notifications

---

## 📊 Dashboard Metrics Explained

### Active Projects
Projects where the developer's proposal has been accepted and the project status is either `in_progress` or `open`.

### Total Earnings
Sum of all `net_amount` from payments where:
- Developer is the recipient
- Payment status is `completed`

### Proposals Sent
Total count of all proposals sent by the developer.

### Success Rate
Calculated as: `(Accepted Proposals / Total Proposals) × 100`
- Returns 0 if no proposals sent yet
- Example: 17 accepted out of 20 sent = 85%

---

## 🔔 Activity Types

### Proposal Accepted
- **Trigger:** When developer's proposal is accepted
- **Description:** Project title
- **Icon:** `check-circle`
- **Color:** `green`

### New Message
- **Trigger:** When developer receives a chat message
- **Description:** Sender's name
- **Icon:** `chat-bubble`
- **Color:** `blue`

### Payment Received
- **Trigger:** When payment to developer is completed
- **Description:** Amount in INR (e.g., "₹25,000")
- **Icon:** `rupee`
- **Color:** `pink`

---

## ⏱️ Time Formatting

Time ago strings are formatted as:
- "Just now" - Less than 1 minute
- "X minutes ago" - Less than 1 hour
- "X hours ago" - Less than 1 day
- "X days ago" - Less than 1 week
- "X weeks ago" - Less than 1 month
- "X months ago" - Less than 1 year
- Date string - More than 1 year

---

## 🔐 Authorization

**Requirements:**
- Must be authenticated (JWT token)
- Must have role `developer`

**Error Responses:**

**401 Unauthorized**
```json
{
  "error": "No token provided"
}
```

**401 Invalid Token**
```json
{
  "error": "Invalid or expired token"
}
```

---

## 🧪 Testing

### Test with cURL

```bash
# 1. Register as developer
curl -X POST https://projexhub-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Developer",
    "email": "bob@example.com",
    "password": "password123",
    "role": "developer",
    "skills": ["React", "Node.js", "TypeScript"]
  }'

# Copy the token from response

# 2. Get developer home data
curl -X GET https://projexhub-backend.onrender.com/api/dev/home \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📱 Frontend Integration Example

### React/React Native Example

```javascript
import React, { useState, useEffect } from 'react';

function DeveloperHomeScreen() {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeveloperHome();
  }, []);

  const fetchDeveloperHome = async () => {
    try {
      const response = await fetch('/api/dev/home', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setHomeData(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <View>
      {/* Developer Header */}
      <Text>Hello, {homeData.developer.name}!</Text>
      <Text>{homeData.developer.rating} Rating</Text>

      {/* Dashboard Metrics */}
      <View style={styles.metricsContainer}>
        <MetricCard
          icon="folder"
          value={homeData.dashboard.activeProjects}
          label="Active Projects"
        />
        <MetricCard
          icon="rupee"
          value={`₹${(homeData.dashboard.totalEarnings / 100000).toFixed(1)}L`}
          label="Total Earnings"
        />
        <MetricCard
          icon="send"
          value={homeData.dashboard.proposalsSent}
          label="Proposals Sent"
        />
        <MetricCard
          icon="trending-up"
          value={`${homeData.dashboard.successRate}%`}
          label="Success Rate"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsContainer}>
        {homeData.quickActions.map(action => (
          <QuickActionButton
            key={action.id}
            title={action.title}
            icon={action.icon}
            color={action.color}
            onPress={() => handleQuickAction(action.action)}
          />
        ))}
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      {homeData.recentActivity.map(activity => (
        <ActivityCard
          key={activity.id}
          title={activity.title}
          description={activity.description}
          icon={activity.icon}
          color={activity.color}
          timeAgo={activity.timeAgo}
          onPress={() => handleActivityPress(activity)}
        />
      ))}
    </View>
  );
}
```

---

## 🔗 Related Endpoints

- `GET /api/projects` - Browse available projects
- `GET /api/proposals/my-proposals` - View sent proposals
- `GET /api/payments/earnings` - Detailed earnings breakdown
- `GET /api/notifications` - All notifications
- `GET /api/chat/conversations` - Chat conversations

---

## 📝 Notes

- **Real-time Data:** All metrics are calculated in real-time
- **Optimized:** Single endpoint for all home screen data
- **Paginated Activity:** Returns max 10 recent activities
- **Sorted:** Activities sorted by most recent first
- **Currency:** Earnings displayed in INR

---

## 🚀 Performance

Endpoint optimized for mobile app usage:
- Single API call for all home data
- Minimal data transfer
- Fast response time (< 500ms typical)

---

## 📞 Support

**Live API:** https://projexhub-backend.onrender.com/api  
**Documentation:** See `API_DOCUMENTATION.md`  
**For issues:** support@projexhub.com

---

**Last Updated:** January 2, 2025

