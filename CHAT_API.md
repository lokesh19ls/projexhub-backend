# 💬 ProjexHub Chat API Documentation

**Base URL:** `https://projexhub-backend.onrender.com/api`

---

## 🔐 Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## 📋 API Endpoints

### 1. Send Message

**Endpoint:** `POST /api/chat/project/:projectId/message`

**Description:** Send a message in a project chat. Supports text messages and file attachments.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**URL Parameters:**
- `projectId` (number) - The project ID

**Request Body (Form Data):**
- `message` (string, optional) - The message text
- `file` (file, optional) - File attachment

**Features:**
- ✅ Text messaging
- ✅ File sharing
- ✅ Automatic notification to receiver
- ✅ Real-time Socket.IO support

**Example Request:**
```bash
curl -X POST https://projexhub-backend.onrender.com/api/chat/project/1/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "message=Hello, how is the project going?"
```

**Example Request with File:**
```bash
curl -X POST https://projexhub-backend.onrender.com/api/chat/project/1/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "message=Here's the updated code" \
  -F "file=@/path/to/file.zip"
```

**Response (201 Created):**
```json
{
  "message": "Message sent successfully",
  "data": {
    "id": 1,
    "project_id": 1,
    "sender_id": 2,
    "receiver_id": 3,
    "message": "Hello, how is the project going?",
    "file_url": null,
    "file_name": null,
    "is_read": false,
    "created_at": "2025-01-20T10:30:00.000Z"
  }
}
```

**Response (201 Created) - With File:**
```json
{
  "message": "Message sent successfully",
  "data": {
    "id": 2,
    "project_id": 1,
    "sender_id": 2,
    "receiver_id": 3,
    "message": "Here's the updated code",
    "file_url": "/uploads/abc123.zip",
    "file_name": "project-source.zip",
    "is_read": false,
    "created_at": "2025-01-20T10:31:00.000Z"
  }
}
```

**Error Responses:**

**403 Forbidden**
```json
{
  "error": "No active developer for this project"
}
```

**404 Not Found**
```json
{
  "error": "Project not found"
}
```

---

### 2. Get Messages

**Endpoint:** `GET /api/chat/project/:projectId/messages`

**Description:** Retrieve all messages for a specific project. Automatically marks messages as read when fetched.

**URL Parameters:**
- `projectId` (number) - The project ID

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/chat/project/1/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "project_id": 1,
    "sender_id": 2,
    "receiver_id": 3,
    "message": "Hello!",
    "file_url": null,
    "file_name": null,
    "is_read": true,
    "created_at": "2025-01-20T10:30:00.000Z",
    "sender_name": "John Doe",
    "sender_photo": "https://example.com/photo.jpg"
  },
  {
    "id": 2,
    "project_id": 1,
    "sender_id": 3,
    "receiver_id": 2,
    "message": "Hi! Working on it right now.",
    "file_url": null,
    "file_name": null,
    "is_read": true,
    "created_at": "2025-01-20T10:31:00.000Z",
    "sender_name": "Jane Developer",
    "sender_photo": "https://example.com/jane.jpg"
  },
  {
    "id": 3,
    "project_id": 1,
    "sender_id": 2,
    "receiver_id": 3,
    "message": "Great! Can you share the progress?",
    "file_url": "/uploads/progress.zip",
    "file_name": "progress.zip",
    "is_read": true,
    "created_at": "2025-01-20T10:32:00.000Z",
    "sender_name": "John Doe",
    "sender_photo": "https://example.com/photo.jpg"
  }
]
```

**Response Fields:**
- `id` - Message ID
- `project_id` - Project ID
- `sender_id` - ID of the user who sent the message
- `receiver_id` - ID of the user who received the message
- `message` - Message text (null if file only)
- `file_url` - URL of attached file (null if text only)
- `file_name` - Name of attached file
- `is_read` - Read status (always true after fetch)
- `created_at` - Timestamp
- `sender_name` - Name of the sender
- `sender_photo` - Profile photo URL of the sender

**Note:** Messages are automatically marked as read when fetched.

**Error Responses:**

**403 Forbidden**
```json
{
  "error": "Unauthorized to view messages"
}
```

**404 Not Found**
```json
{
  "error": "Project not found"
}
```

---

### 3. Get Conversations

**Endpoint:** `GET /api/chat/conversations`

**Description:** Get all conversations (chat history) for the authenticated user across all their projects.

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/chat/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "E-commerce Website",
    "status": "in_progress",
    "other_user_id": 3,
    "other_user_name": "Jane Developer",
    "other_user_photo": "https://example.com/jane.jpg",
    "last_message": "Thanks for the update!",
    "last_message_time": "2025-01-20T10:35:00.000Z"
  },
  {
    "id": 2,
    "title": "Mobile App Development",
    "status": "open",
    "other_user_id": 5,
    "other_user_name": "Bob Student",
    "other_user_photo": "https://example.com/bob.jpg",
    "last_message": "When can we start?",
    "last_message_time": "2025-01-20T09:15:00.000Z"
  }
]
```

**Response Fields:**
- `id` - Project ID
- `title` - Project title
- `status` - Project status (open, in_progress, completed, cancelled)
- `other_user_id` - ID of the other user in the conversation
- `other_user_name` - Name of the other user
- `other_user_photo` - Profile photo URL of the other user
- `last_message` - Last message sent in the conversation
- `last_message_time` - Timestamp of the last message

**Note:** Only returns conversations for projects where the user is either the student or the accepted developer.

---

## 🔄 Real-time Chat with Socket.IO

The chat system supports real-time messaging using Socket.IO.

### Connection Setup

**Frontend (JavaScript/Flutter/React Native):**
```javascript
import { io } from 'socket.io-client';

const socket = io('https://projexhub-backend.onrender.com', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected to chat server');
});
```

### Socket Events

#### 1. Join Room

Join a project's chat room to receive real-time messages.

```javascript
socket.emit('join-room', projectId);
```

**Parameters:**
- `projectId` (number) - The project ID

**Example:**
```javascript
socket.emit('join-room', 1);
```

#### 2. Send Message

Send a message via WebSocket (in addition to REST API).

```javascript
socket.emit('send-message', {
  projectId: 1,
  senderId: 2,
  message: 'Hello from real-time!',
  timestamp: new Date()
});
```

**Data Object:**
- `projectId` (number) - The project ID
- `senderId` (number) - ID of the sender
- `message` (string) - The message text
- `timestamp` (Date/string) - Message timestamp

#### 3. Receive Message

Listen for new messages in real-time.

```javascript
socket.on('receive-message', (data) => {
  console.log('New message:', data);
  // data contains: projectId, senderId, message, timestamp
});
```

**Complete Example:**
```javascript
// Connect
const socket = io('https://projexhub-backend.onrender.com');

// Join project room
socket.emit('join-room', 1);

// Listen for messages
socket.on('receive-message', (data) => {
  console.log('New message received:', data.message);
  console.log('From:', data.senderId);
  // Update UI with new message
});

// Send message
function sendMessage(text) {
  socket.emit('send-message', {
    projectId: 1,
    senderId: currentUserId,
    message: text,
    timestamp: new Date()
  });
}
```

---

## 🔐 Authorization & Access Control

### Rules

1. Authentication required for all endpoints.
2. Users can only chat on projects they own or are assigned to.
3. A proposal must be accepted before chat can start.
4. Messages are auto-directed to the other party.

### Access Matrix

| User Role | Student's Project | Developer's Project | Other Projects |
|-----------|------------------|---------------------|----------------|
| Student | ✅ Can chat | ❌ No access | ❌ No access |
| Developer | ✅ Can chat (if accepted) | ❌ No access | ❌ No access |
| Admin | ✅ Can chat | ✅ Can chat | ✅ Can chat |

---

## 📊 Message Flow

```
┌─────────────┐
│   Student   │
└──────┬──────┘
       │
       │ Sends Message
       ▼
┌─────────────────────────────┐
│  POST /chat/project/:id/    │
│        message              │
└──────┬──────────────────────┘
       │
       │ 1. Stores in database
       │ 2. Creates notification
       │ 3. Emits Socket.IO event
       ▼
┌─────────────┐
│  Developer  │
└─────────────┘
```

---

## 🔔 Notifications

On send:
1. Saves to `chat_messages`.
2. Creates a `notifications` record.
3. Emits Socket.IO event.
4. For mobile: add Firebase Cloud Messaging.

---

## 📁 File Attachments

### Supported Operations
- Upload files via multipart/form-data.
- Supported types: documents, images, archives, code.
- Max size: 10MB per file (configurable).

### Example: Send File
```javascript
const formData = new FormData();
formData.append('message', 'Here is the source code');
formData.append('file', fileBlob, 'project.zip');

fetch('https://projexhub-backend.onrender.com/api/chat/project/1/message', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### File Access
```
https://projexhub-backend.onrender.com/uploads/filename.ext
```

---

## 📝 Best Practices

1. Use Socket.IO for real-time, REST for history.
2. Fetch messages on load, add pagination if needed.
3. Handle errors and retries.
4. Mark read when viewed.
5. Show delivery/read status.

---

## 🧪 Testing

### Test with cURL

**1. Send a message:**
```bash
curl -X POST https://projexhub-backend.onrender.com/api/chat/project/1/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "message=Hello, how is the project going?"
```

**2. Get messages:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/chat/project/1/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. Get conversations:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/chat/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Common Errors

| Error | Status Code | Cause | Solution |
|-------|-------------|-------|----------|
| Project not found | 404 | Invalid project ID | Check project exists |
| Unauthorized to view messages | 403 | Not project participant | Join or accept proposal |
| No active developer | 400 | No accepted proposal | Accept a proposal first |
| Token required | 401 | Missing/invalid token | Provide valid JWT |

---

## 🔗 Related Endpoints

- `GET /api/projects/:id` - Get project details
- `GET /api/proposals/project/:projectId` - Get project proposals
- `POST /api/proposals/:id/accept` - Accept proposal
- `GET /api/auth/profile` - Get user profile

---

## 📞 Support

Live API: https://projexhub-backend.onrender.com/api  
Documentation: See `API_DOCUMENTATION.md`  
For issues: support@projexhub.com

---

**Last Updated:** January 2025

