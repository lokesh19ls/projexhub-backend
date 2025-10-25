# Home Endpoint Documentation

## Overview
The home endpoint provides a single API call that fetches all the data needed for the home screen, including dashboard metrics, recent activity, and quick actions tailored to the user's role.

## Endpoint
```
GET /api/home
```

## Authentication
- **Required**: Bearer token in Authorization header
- **Example**: `Authorization: Bearer <jwt_token>`

## Response Format

### Student Response
```json
{
  "user": {
    "name": "Test User",
    "college": "Test College",
    "role": "student"
  },
  "dashboardMetrics": {
    "activeProjects": 0,    // Number of open projects posted by student
    "proposals": 0,         // Total proposals received for student's projects
    "messages": 0,          // Number of unread messages
    "completed": 0          // Number of completed projects
  },
  "recentActivity": [
    {
      "id": "proposal_123",
      "type": "proposal_received",
      "title": "New proposal received",
      "message": "Project Title",
      "icon": "handshake",
      "color": "green",
      "timestamp": "2025-10-24T10:36:27.538Z",
      "time_ago": "2 minutes ago"
    }
  ],
  "quickActions": [
    {
      "id": 1,
      "title": "Post New Project",
      "icon": "plus",
      "color": "purple",
      "action": "post_project"
    },
    {
      "id": 2,
      "title": "AI Project Ideas",
      "icon": "sparkles",
      "color": "purple",
      "action": "ai_ideas"
    },
    {
      "id": 3,
      "title": "Browse Developers",
      "icon": "users",
      "color": "green",
      "action": "browse_developers"
    },
    {
      "id": 4,
      "title": "View Reports",
      "icon": "chart",
      "color": "pink",
      "action": "view_reports"
    }
  ]
}
```

### Developer Response
```json
{
  "user": {
    "name": "Developer User",
    "college": "Tech University",
    "role": "developer"
  },
  "dashboardMetrics": {
    "activeProjects": 0,    // Projects where developer's proposal was accepted
    "proposals": 0,         // Total proposals sent by developer
    "messages": 0,          // Number of unread messages
    "completed": 0          // Number of completed projects
  },
  "recentActivity": [
    {
      "id": "proposal_123",
      "type": "proposal_accepted",
      "title": "Proposal accepted",
      "message": "Project Title",
      "icon": "handshake",
      "color": "green",
      "timestamp": "2025-10-24T10:36:27.538Z",
      "time_ago": "2 minutes ago"
    }
  ],
  "quickActions": [
    {
      "id": 1,
      "title": "Browse Projects",
      "icon": "folder",
      "color": "purple",
      "action": "browse_projects"
    },
    {
      "id": 2,
      "title": "My Proposals",
      "icon": "handshake",
      "color": "purple",
      "action": "my_proposals"
    },
    {
      "id": 3,
      "title": "My Earnings",
      "icon": "dollar",
      "color": "green",
      "action": "my_earnings"
    },
    {
      "id": 4,
      "title": "View Reports",
      "icon": "chart",
      "color": "pink",
      "action": "view_reports"
    }
  ]
}
```

### Admin Response
```json
{
  "user": {
    "name": "Admin User",
    "college": "Admin University",
    "role": "admin"
  },
  "dashboardMetrics": {
    "activeProjects": 0,    // Total active projects in system
    "proposals": 0,         // Total pending proposals in system
    "messages": 0,          // Total unread messages in system
    "completed": 0          // Total completed projects in system
  },
  "recentActivity": [],
  "quickActions": [
    {
      "id": 1,
      "title": "Dashboard",
      "icon": "dashboard",
      "color": "purple",
      "action": "dashboard"
    },
    {
      "id": 2,
      "title": "Manage Users",
      "icon": "users",
      "color": "purple",
      "action": "manage_users"
    },
    {
      "id": 3,
      "title": "View Disputes",
      "icon": "alert",
      "color": "green",
      "action": "view_disputes"
    },
    {
      "id": 4,
      "title": "Analytics",
      "icon": "chart",
      "color": "pink",
      "action": "analytics"
    }
  ]
}
```

## Dashboard Metrics Explanation

### For Students:
- **activeProjects**: Number of projects posted by the student that are currently open
- **proposals**: Total number of proposals received for all the student's projects
- **messages**: Number of unread chat messages received by the student
- **completed**: Number of projects completed by the student

### For Developers:
- **activeProjects**: Number of projects where the developer's proposal was accepted and is currently active
- **proposals**: Total number of proposals sent by the developer
- **messages**: Number of unread chat messages received by the developer
- **completed**: Number of projects completed by the developer

### For Admins:
- **activeProjects**: Total number of open projects in the system
- **proposals**: Total number of pending proposals in the system
- **messages**: Total number of unread messages in the system
- **completed**: Total number of completed projects in the system

## Recent Activity Types

### For Students:
- `proposal_received`: New proposal received for one of their projects
- `message_received`: New message from a developer

### For Developers:
- `proposal_sent`: Proposal sent to a project
- `proposal_accepted`: Proposal was accepted
- `message_received`: New message from a student

## Quick Actions

The quick actions are role-specific and provide shortcuts to common tasks:

### Student Actions:
1. **Post New Project** - Navigate to project creation
2. **AI Project Ideas** - Generate project ideas using AI
3. **Browse Developers** - View available developers
4. **View Reports** - Access analytics and reports

### Developer Actions:
1. **Browse Projects** - View available projects to work on
2. **My Proposals** - View sent proposals and their status
3. **My Earnings** - View earnings and payment history
4. **View Reports** - Access analytics and reports

### Admin Actions:
1. **Dashboard** - Access admin dashboard
2. **Manage Users** - User management interface
3. **View Disputes** - Handle disputes and issues
4. **Analytics** - System analytics and reports

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Access denied",
  "message": "No token provided"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

## Usage Examples

### cURL Example
```bash
curl -X GET "http://localhost:3000/api/home" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json"
```

### JavaScript Example
```javascript
const response = await fetch('/api/home', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const homeData = await response.json();
console.log(homeData);
```

## Performance Notes

- The endpoint aggregates data from multiple database tables
- Recent activity is limited to the last 10 items
- Dashboard metrics are calculated in real-time
- The endpoint is optimized for mobile app usage with minimal API calls

## Implementation Details

The home endpoint is implemented using:
- **Service Layer**: `HomeService` handles business logic
- **Controller Layer**: `homeController` handles HTTP requests
- **Route Layer**: `homeRoutes` defines the endpoint
- **Authentication**: JWT token validation
- **Database**: PostgreSQL with optimized queries

## Related Endpoints

- `GET /api/projects` - Browse projects
- `GET /api/proposals` - View proposals
- `GET /api/chat/conversations` - Chat conversations
- `GET /api/admin/dashboard/stats` - Admin dashboard stats
