# ProjexHub API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## 1. Authentication Endpoints

### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123",
  "role": "student",
  "college": "MIT",
  "department": "Computer Science",
  "yearOfStudy": 4,
  "skills": ["JavaScript", "React"]
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Send OTP
```http
POST /auth/send-otp
Content-Type: application/json

{
  "phone": "9876543210"
}
```

### Verify OTP
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}
```

### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

---

## 2. Project Endpoints

### Create Project (Student)
```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "E-commerce Website",
  "description": "A full-stack e-commerce platform with user authentication, product catalog, shopping cart, and payment integration.",
  "technology": ["React", "Node.js", "MongoDB"],
  "budget": 5000,
  "deadline": "2024-06-30"
}
```

### Get All Projects
```http
GET /projects?status=open&technology=React&minBudget=1000&maxBudget=10000&search=ecommerce&limit=20&offset=0
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: open, in_progress, completed, cancelled
- `technology`: Filter by technology
- `minBudget`: Minimum budget
- `maxBudget`: Maximum budget
- `search`: Search in title and description
- `limit`: Number of results (default: 20)
- `offset`: Pagination offset (default: 0)

### Get Project by ID
```http
GET /projects/:id
Authorization: Bearer <token>
```

### Update Project (Student)
```http
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "budget": 6000
}
```

### Delete Project (Student)
```http
DELETE /projects/:id
Authorization: Bearer <token>
```

### Get My Projects
```http
GET /projects/my-projects
Authorization: Bearer <token>
```

---

## 3. Proposal Endpoints

### Send Proposal (Developer)
```http
POST /proposals/project/:projectId
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 4500,
  "timeline": 30,
  "technology": ["React", "Node.js", "MongoDB"],
  "message": "I have 5 years of experience in full-stack development..."
}
```

### Get Project Proposals (Student)
```http
GET /proposals/project/:projectId
Authorization: Bearer <token>
```

### Get My Proposals (Developer)
```http
GET /proposals/my-proposals
Authorization: Bearer <token>
```

### Accept Proposal (Student)
```http
POST /proposals/:id/accept
Authorization: Bearer <token>
```

### Reject Proposal (Student)
```http
POST /proposals/:id/reject
Authorization: Bearer <token>
```

### Get Proposal by ID
```http
GET /proposals/:id
Authorization: Bearer <token>
```

---

## 4. Payment Endpoints

### Create Payment Order
```http
POST /payments/project/:projectId/order
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentMethod": "upi",
  "paymentType": "advance",
  "milestonePercentage": 0
}
```

**Payment Types:**
- `advance`: 50% advance payment
- `full`: Full payment
- `milestone`: Milestone-based payment (requires milestonePercentage: 20, 50, or 100)

**Response:**
```json
{
  "payment": { ... },
  "razorpayOrder": {
    "id": "order_xxx",
    "amount": 250000,
    "currency": "INR",
    ...
  }
}
```

### Verify Payment
```http
POST /payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### Get Payment History
```http
GET /payments/history
Authorization: Bearer <token>
```

### Get Earnings (Developer)
```http
GET /payments/earnings
Authorization: Bearer <token>
```

---

## 5. Chat Endpoints

### Get Conversations
```http
GET /chat/conversations
Authorization: Bearer <token>
```

### Get Messages
```http
GET /chat/project/:projectId/messages
Authorization: Bearer <token>
```

### Send Message
```http
POST /chat/project/:projectId/message
Authorization: Bearer <token>
Content-Type: multipart/form-data

message: "Hello, I have a question about the project"
file: <optional file>
```

---

## 6. Review Endpoints

### Create Review
```http
POST /reviews/project/:projectId
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent work! The developer delivered on time and exceeded expectations."
}
```

### Get User Reviews
```http
GET /reviews/user/:userId
Authorization: Bearer <token>
```

### Get Project Reviews
```http
GET /reviews/project/:projectId/reviews
Authorization: Bearer <token>
```

---

## 7. AI Endpoints

### Generate Project Ideas
```http
POST /ai/generate-ideas
Authorization: Bearer <token>
Content-Type: application/json

{
  "department": "Computer Science",
  "technology": ["Python", "Machine Learning"],
  "difficulty": "intermediate"
}
```

**Response:**
```json
[
  {
    "title": "Sentiment Analysis Tool",
    "description": "A tool that analyzes sentiment from social media posts...",
    "features": ["Real-time analysis", "Multi-language support", "Visualization"],
    "technologies": ["Python", "NLTK", "Flask"],
    "duration": 3
  },
  ...
]
```

### Get Project Suggestions
```http
POST /ai/project-suggestions
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentProject": "E-commerce website with React and Node.js"
}
```

---

## 8. Admin Endpoints

### Get Dashboard Stats
```http
GET /admin/dashboard/stats
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "total_students": 150,
  "total_developers": 75,
  "total_projects": 200,
  "open_projects": 50,
  "in_progress_projects": 100,
  "completed_projects": 50,
  "total_proposals": 300,
  "total_commission": 50000
}
```

### Get All Users
```http
GET /admin/users?role=developer&isVerified=true&page=1&limit=20
Authorization: Bearer <admin_token>
```

### Verify User
```http
POST /admin/users/:userId/verify
Authorization: Bearer <admin_token>
```

### Deactivate User
```http
POST /admin/users/:userId/deactivate
Authorization: Bearer <admin_token>
```

### Get All Projects
```http
GET /admin/projects?status=open&page=1&limit=20
Authorization: Bearer <admin_token>
```

### Get All Disputes
```http
GET /admin/disputes?status=open
Authorization: Bearer <admin_token>
```

### Resolve Dispute
```http
POST /admin/disputes/:disputeId/resolve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "resolution": "Issue resolved. Payment released to developer."
}
```

### Get All Payments
```http
GET /admin/payments?status=completed&page=1&limit=20
Authorization: Bearer <admin_token>
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": ["email must be a valid email"]
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden: Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Project not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## WebSocket Events

### Join Room
```javascript
socket.emit('join-room', projectId);
```

### Send Message
```javascript
socket.emit('send-message', {
  projectId: '123',
  senderId: '456',
  message: 'Hello!',
  timestamp: new Date()
});
```

### Receive Message
```javascript
socket.on('receive-message', (data) => {
  console.log('New message:', data);
});
```

---

## Testing with cURL

### Register a Student
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "password123",
    "role": "student",
    "college": "MIT",
    "department": "Computer Science",
    "yearOfStudy": 4
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Projects (with token)
```bash
curl -X GET http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Postman Collection

Import this collection into Postman for easy testing:
- Base URL: `http://localhost:3000/api`
- Environment variables:
  - `token`: Your JWT token
  - `projectId`: Project ID for testing
  - `proposalId`: Proposal ID for testing

---

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute

---

## Support

For API support, please contact: support@projexhub.com

