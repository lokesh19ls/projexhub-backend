# 👨‍💻 Developer API Documentation

**Base URL:** `https://projexhub-backend.onrender.com/api`

---

## 🔐 Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## 📋 API Endpoints

### 1. Get Developer Home Data

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
- `GET /api/dev/projects` - Browse projects (developer view with applied status)
- `PUT /api/dev/projects/:id/progress` - Update project progress
- `GET /api/proposals/my-proposals` - View sent proposals
- `POST /api/proposals/project/:projectId` - Send proposal
- `GET /api/payments/earnings` - Detailed earnings breakdown
- `GET /api/notifications` - All notifications
- `GET /api/chat/conversations` - Chat conversations

---

### 2. Browse Projects

**Endpoint:** `GET /api/dev/projects`

**Description:** Browse all available projects with advanced filters. Shows if developer has already applied.

**Query Parameters:**
- `status` (string, optional) - Filter by status: open, in_progress, completed, cancelled
- `technology` (string, optional) - Filter by technology (e.g., "React", "Flutter")
- `minBudget` (number, optional) - Minimum budget filter
- `maxBudget` (number, optional) - Maximum budget filter
- `search` (string, optional) - Search in title and description
- `limit` (number, optional) - Number of results (default: 20)
- `offset` (number, optional) - Pagination offset (default: 0)

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/dev/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Request with Filters:**
```bash
curl -X GET "https://projexhub-backend.onrender.com/api/dev/projects?technology=React&minBudget=5000&maxBudget=20000&status=open" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "student_id": 10,
    "title": "E-commerce Mobile App",
    "description": "Build a modern e-commerce application...",
    "technology": ["Flutter", "Dart", "Firebase"],
    "budget": "15000.00",
    "deadline": "2026-08-15T00:00:00.000Z",
    "status": "open",
    "accepted_proposal_id": null,
    "progress_percentage": 0,
    "created_at": "2025-01-20T10:00:00.000Z",
    "updated_at": "2025-01-20T10:00:00.000Z",
    "student_name": "Alice Student",
    "college": "MIT",
    "department": "Computer Science",
    "proposals_count": "3",
    "has_applied": "0",
    "my_proposal_id": null
  },
  {
    "id": 2,
    "student_id": 11,
    "title": "AI Chatbot Application",
    "description": "Build an intelligent chatbot...",
    "technology": ["Python", "OpenAI", "Flask"],
    "budget": "8000.00",
    "deadline": "2026-07-30T00:00:00.000Z",
    "status": "open",
    "accepted_proposal_id": null,
    "progress_percentage": 0,
    "created_at": "2025-01-19T09:00:00.000Z",
    "updated_at": "2025-01-19T09:00:00.000Z",
    "student_name": "Bob Student",
    "college": "Stanford",
    "department": "CS",
    "proposals_count": "1",
    "has_applied": "1",
    "my_proposal_id": 5
  }
]
```

**Response Fields:**
- `id` - Project ID
- `student_id` - Student's user ID
- `title` - Project title
- `description` - Project description
- `technology` - Array of technologies
- `budget` - Budget in INR
- `deadline` - Project deadline
- `status` - Project status (open, in_progress, completed, cancelled)
- `accepted_proposal_id` - ID of accepted proposal (null if open)
- `progress_percentage` - Progress percentage
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `student_name` - Student's name
- `college` - Student's college
- `department` - Student's department
- `proposals_count` - Total number of proposals received
- `has_applied` - "1" if developer has applied, "0" if not
- `my_proposal_id` - Developer's proposal ID (if applied)

**Key Features:**
- ✅ Shows if developer has already applied
- ✅ Includes developer's proposal ID (if applied)
- ✅ Total proposals count
- ✅ Advanced filtering
- ✅ Search functionality
- ✅ Pagination support
- ✅ Student information included

---

### 3. Update Project Progress

**Endpoint:** `PUT /api/dev/projects/:projectId/progress`

**Description:** Update project progress and status. Automatically sends notifications to students.

**URL Parameters:**
- `projectId` (number) - The project ID

**Request Body:**
```json
{
  "progressPercentage": 50,
  "status": "in_progress",
  "progressNote": "Halfway through! Core features implemented."
}
```

**Request Fields:**
- `progressPercentage` (number, optional) - Progress percentage (must be 0, 20, 50, or 100)
- `status` (string, optional) - Project status: "in_progress" or "completed"
- `progressNote` (string, optional) - Optional note about the progress

**Example Request:**
```bash
curl -X PUT https://projexhub-backend.onrender.com/api/dev/projects/1/progress \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "progressPercentage": 50,
    "status": "in_progress",
    "progressNote": "Core features completed"
  }'
```

**Response (200 OK):**
```json
{
  "message": "Project progress updated successfully",
  "project": {
    "id": 1,
    "title": "E-commerce App",
    "status": "in_progress",
    "progress_percentage": 50,
    "updated_at": "2025-01-20T10:30:00.000Z"
  },
  "progressNote": "Core features completed",
  "notification": {
    "title": "Project Progress: 50%",
    "message": "Developer reached 50% milestone for \"E-commerce App\""
  }
}
```

**Milestone Notifications:**
- **20%**: "Project Progress: 20%" - "Developer reached 20% milestone"
- **50%**: "Project Progress: 50%" - "Developer reached 50% milestone"
- **100%**: "Project Completed!" - Auto-sets status to completed
- **Status Completed**: "Project Completed!" - "Developer marked project as completed"
- **Status In Progress**: "Project Status Updated" - "Developer set project to In Progress"

**Key Features:**
- ✅ Update progress milestones (20%, 50%, 100%)
- ✅ Update project status
- ✅ Auto-complete when progress reaches 100%
- ✅ Progress notes support
- ✅ Automatic notifications to students
- ✅ Authorization (only assigned developers)
- ✅ Validation (valid milestone percentages)

**Error Responses:**

**400 Bad Request**
```json
{
  "error": "Progress percentage must be 0, 20, 50, or 100"
}
```

**404 Not Found**
```json
{
  "error": "Project not found or you are not assigned to this project"
}
```

---

## 📝 Notes

### Developer Home API
- **Real-time Data:** All metrics calculated in real-time
- **Optimized:** Single endpoint for all home screen data
- **Paginated Activity:** Returns max 10 recent activities
- **Sorted:** Activities sorted by most recent first
- **Currency:** Earnings displayed in INR

### Browse Projects API
- **Applied Status:** Shows if developer already sent proposal
- **Proposal ID:** Returns developer's proposal ID if applied
- **Filters:** Support for technology, status, budget, search
- **Pagination:** Limit and offset support
- **Student Info:** Includes student details

### Update Progress API
- **Milestones:** Only valid percentages (0, 20, 50, 100)
- **Auto-complete:** Progress 100% automatically sets status to completed
- **Notifications:** Automatic notifications to students on updates
- **Authorization:** Only developers assigned to project can update
- **Notes:** Optional progress notes for tracking

---

## 🚀 Performance

Endpoints optimized for mobile app usage:
- Single API call for all home data
- Minimal data transfer
- Fast response time (< 500ms typical)
- Efficient queries with proper indexing

---

## 📞 Support

**Live API:** https://projexhub-backend.onrender.com/api  
**Documentation:** See `API_DOCUMENTATION.md`  
**For issues:** support@projexhub.com

---

**Last Updated:** January 2, 2025

