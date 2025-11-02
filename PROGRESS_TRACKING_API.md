# 📊 Student Project Progress Tracking API

**Base URL:** `https://projexhub-backend.onrender.com/api`

---

## Overview

The Progress Tracking API allows students to view comprehensive progress information for their projects, including milestone tracking, progress history, timeline information, and developer details.

---

## 🎯 Endpoint

### Get Project Progress Tracking

**Endpoint:** `GET /api/projects/:id/progress`

**Description:** Get detailed progress tracking information for a project including milestones, history, timeline, and developer information.

**Authorization:** Student or Admin only

**URL Parameters:**
- `id` (number) - The project ID

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/projects/1/progress \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "message": "Project progress tracking data retrieved successfully",
  "data": {
    "project": {
      "id": 1,
      "title": "E-commerce Website",
      "status": "in_progress",
      "progressPercentage": 50,
      "deadline": "2026-12-31",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-20T14:30:00.000Z"
    },
    "developer": {
      "id": 5,
      "name": "John Developer",
      "email": "john@example.com",
      "rating": 4.5,
      "photo": "https://example.com/photo.jpg"
    },
    "proposal": {
      "timeline": 45,
      "price": 12000
    },
    "milestones": [
      {
        "percentage": 20,
        "label": "20% Milestone",
        "completed": true,
        "completedAt": "2025-01-18T10:00:00.000Z",
        "note": "Project setup completed. Basic architecture in place."
      },
      {
        "percentage": 50,
        "label": "50% Milestone",
        "completed": true,
        "completedAt": "2025-01-20T14:30:00.000Z",
        "note": "Halfway milestone achieved! Core features implemented and tested."
      },
      {
        "percentage": 100,
        "label": "100% Complete",
        "completed": false,
        "completedAt": null,
        "note": null
      }
    ],
    "progressHistory": [
      {
        "id": 2,
        "progressPercentage": 50,
        "status": "in_progress",
        "progressNote": "Halfway milestone achieved! Core features implemented and tested.",
        "updatedBy": {
          "id": 5,
          "name": "John Developer"
        },
        "createdAt": "2025-01-20T14:30:00.000Z"
      },
      {
        "id": 1,
        "progressPercentage": 20,
        "status": "in_progress",
        "progressNote": "Project setup completed. Basic architecture in place.",
        "updatedBy": {
          "id": 5,
          "name": "John Developer"
        },
        "createdAt": "2025-01-18T10:00:00.000Z"
      }
    ],
    "timeline": {
      "startDate": "2025-01-15T10:00:00.000Z",
      "deadline": "2026-12-31T00:00:00.000Z",
      "daysElapsed": 5,
      "daysRemaining": 345,
      "totalDays": 45,
      "daysOverdue": 0,
      "isOverdue": false
    },
    "currentProgress": {
      "percentage": 50,
      "status": "in_progress",
      "latestUpdate": "2025-01-20T14:30:00.000Z",
      "latestNote": "Halfway milestone achieved! Core features implemented and tested."
    }
  }
}
```

---

## 📋 Response Fields

### Project
- `id` - Project ID
- `title` - Project title
- `status` - Current status (open, in_progress, completed, cancelled)
- `progressPercentage` - Current progress (0, 20, 50, 100)
- `deadline` - Project deadline
- `createdAt` - Project creation date
- `updatedAt` - Last update date

### Developer
- `id` - Developer user ID
- `name` - Developer name
- `email` - Developer email
- `rating` - Developer rating
- `photo` - Profile photo URL

### Proposal
- `timeline` - Project timeline in days
- `price` - Proposal price

### Milestones
Array of milestone objects with:
- `percentage` - Milestone percentage (20, 50, 100)
- `label` - Milestone label
- `completed` - Whether milestone is completed
- `completedAt` - Completion date (null if not completed)
- `note` - Progress note from milestone completion

### Progress History
Array of progress update objects (sorted by most recent first):
- `id` - History entry ID
- `progressPercentage` - Progress percentage at this update
- `status` - Status at this update
- `progressNote` - Note provided with this update
- `updatedBy` - Object with developer ID and name
- `createdAt` - Update timestamp

### Timeline
- `startDate` - Project start date
- `deadline` - Project deadline
- `daysElapsed` - Days since project started
- `daysRemaining` - Days until deadline (0 if overdue)
- `totalDays` - Total timeline from proposal
- `daysOverdue` - Days overdue (0 if not overdue)
- `isOverdue` - Boolean indicating if deadline has passed

### Current Progress
- `percentage` - Current progress percentage
- `status` - Current status
- `latestUpdate` - Most recent update timestamp
- `latestNote` - Most recent progress note

---

## 🔒 Authorization

- **Allowed:** Students (project owners) and Admins
- **Forbidden:** Developers and other students

**Error Response (403 Forbidden):**
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Project not found or unauthorized"
}
```

---

## ✨ Key Features

- ✅ **Milestone Tracking** - View completion status of 20%, 50%, and 100% milestones
- ✅ **Progress History** - Complete history of all progress updates with notes
- ✅ **Timeline Tracking** - Days elapsed, remaining, and overdue status
- ✅ **Developer Information** - View assigned developer details
- ✅ **Proposal Details** - See timeline and price from accepted proposal
- ✅ **Current Status** - Latest progress and update information
- ✅ **Student-Only Access** - Only project owners can view progress

---

## 🔗 Related Endpoints

- `PUT /api/dev/projects/:id/progress` - Developer updates project progress
- `GET /api/projects/:id` - Get project details
- `GET /api/projects/my-projects` - Get student's projects
- `GET /api/notifications` - View progress update notifications

---

## 📝 Notes

### Progress History
- Progress history is automatically created when developers update progress
- History includes progress percentage, status, notes, and update timestamp
- History is sorted by most recent first

### Milestones
- Milestones are automatically tracked based on progress updates
- Only milestone percentages (20%, 50%, 100%) are tracked
- Completion date and note are captured from the first update at that milestone

### Timeline Calculation
- `daysElapsed` is calculated from project creation date
- `daysRemaining` is calculated until deadline
- `isOverdue` is true if deadline has passed
- `daysOverdue` shows how many days past the deadline

---

## 🚀 Usage Example

```javascript
// Fetch progress tracking for a project
const response = await fetch('https://projexhub-backend.onrender.com/api/projects/1/progress', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

// Access milestones
data.data.milestones.forEach(milestone => {
  console.log(`${milestone.label}: ${milestone.completed ? 'Completed' : 'Pending'}`);
});

// Access progress history
data.data.progressHistory.forEach(update => {
  console.log(`Progress ${update.progressPercentage}%: ${update.progressNote}`);
});

// Check timeline
const timeline = data.data.timeline;
console.log(`Days remaining: ${timeline.daysRemaining}`);
console.log(`Overdue: ${timeline.isOverdue}`);
```

---

## 📞 Support

**Live API:** https://projexhub-backend.onrender.com/api  
**Documentation:** See `API_DOCUMENTATION.md`

