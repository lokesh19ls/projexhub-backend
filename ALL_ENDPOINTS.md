# 🚀 ProjexHub API - Complete Endpoints List

**Base URL:** `http://localhost:3000/api`

---

## 🔐 Authentication Endpoints

### 1. Register User
```http
POST /api/auth/register
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

### 2. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### 3. Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "phone": "9876543210"
}
```

### 4. Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phone": "9876543210",
  "otp": "123456"
}
```

### 5. Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

---

## 📁 Project Endpoints

### 6. Create Project (Student)
```http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "E-commerce Website",
  "description": "A full-stack e-commerce platform with user authentication, product catalog, shopping cart, and payment integration",
  "technology": ["React", "Node.js", "MongoDB"],
  "budget": 5000,
  "deadline": "2024-06-30"
}
```

### 7. Get All Projects
```http
GET /api/projects?status=open&technology=React&minBudget=1000&maxBudget=10000&search=ecommerce&limit=20&offset=0
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

### 8. Get Project by ID
```http
GET /api/projects/:id
Authorization: Bearer <token>
```

### 9. Update Project (Student)
```http
PUT /api/projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "budget": 6000
}
```

### 10. Delete Project (Student)
```http
DELETE /api/projects/:id
Authorization: Bearer <token>
```

### 11. Get My Projects
```http
GET /api/projects/my-projects
Authorization: Bearer <token>
```

---

## 💼 Proposal Endpoints

### 12. Send Proposal (Developer)
```http
POST /api/proposals/project/:projectId
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 4500,
  "timeline": 30,
  "technology": ["React", "Node.js", "MongoDB"],
  "message": "I have 5 years of experience in full-stack development..."
}
```

### 13. Get Project Proposals (Student)
```http
GET /api/proposals/project/:projectId
Authorization: Bearer <token>
```

### 14. Get My Proposals (Developer)
```http
GET /api/proposals/my-proposals
Authorization: Bearer <token>
```

### 15. Accept Proposal (Student)
```http
POST /api/proposals/:id/accept
Authorization: Bearer <token>
```

### 16. Reject Proposal (Student)
```http
POST /api/proposals/:id/reject
Authorization: Bearer <token>
```

### 17. Get Proposal by ID
```http
GET /api/proposals/:id
Authorization: Bearer <token>
```

---

## 💳 Payment Endpoints

### 18. Create Payment Order
```http
POST /api/payments/project/:projectId/order
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

### 19. Verify Payment
```http
POST /api/payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

### 20. Get Payment History
```http
GET /api/payments/history
Authorization: Bearer <token>
```

### 21. Get Earnings (Developer)
```http
GET /api/payments/earnings
Authorization: Bearer <token>
```

---

## 💬 Chat Endpoints

### 22. Get Conversations
```http
GET /api/chat/conversations
Authorization: Bearer <token>
```

### 23. Get Messages
```http
GET /api/chat/project/:projectId/messages
Authorization: Bearer <token>
```

### 24. Send Message
```http
POST /api/chat/project/:projectId/message
Authorization: Bearer <token>
Content-Type: multipart/form-data

message: "Hello, I have a question about the project"
file: <optional file>
```

---

## ⭐ Review Endpoints

### 25. Create Review
```http
POST /api/reviews/project/:projectId
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 5,
  "comment": "Excellent work! The developer delivered on time and exceeded expectations."
}
```

### 26. Get User Reviews
```http
GET /api/reviews/user/:userId
Authorization: Bearer <token>
```

### 27. Get Project Reviews
```http
GET /api/reviews/project/:projectId/reviews
Authorization: Bearer <token>
```

---

## 🤖 AI Endpoints

### 28. Generate Project Ideas
```http
POST /api/ai/generate-ideas
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
  }
]
```

### 29. Get Project Suggestions
```http
POST /api/ai/project-suggestions
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentProject": "E-commerce website with React and Node.js"
}
```

---

## 👨‍💼 Admin Endpoints

### 30. Get Dashboard Stats
```http
GET /api/admin/dashboard/stats
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

### 31. Get All Users
```http
GET /api/admin/users?role=developer&isVerified=true&page=1&limit=20
Authorization: Bearer <admin_token>
```

### 32. Verify User
```http
POST /api/admin/users/:userId/verify
Authorization: Bearer <admin_token>
```

### 33. Deactivate User
```http
POST /api/admin/users/:userId/deactivate
Authorization: Bearer <admin_token>
```

### 34. Get All Projects
```http
GET /api/admin/projects?status=open&page=1&limit=20
Authorization: Bearer <admin_token>
```

### 35. Get All Disputes
```http
GET /api/admin/disputes?status=open
Authorization: Bearer <admin_token>
```

### 36. Resolve Dispute
```http
POST /api/admin/disputes/:disputeId/resolve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "resolution": "Issue resolved. Payment released to developer."
}
```

### 37. Get All Payments
```http
GET /api/admin/payments?status=completed&page=1&limit=20
Authorization: Bearer <admin_token>
```

---

## 🔑 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_token>
```

---

## 📊 Endpoint Summary

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Authentication** | 5 | Register, login, OTP, profile |
| **Projects** | 6 | Create, browse, update, delete projects |
| **Proposals** | 6 | Send, view, accept, reject proposals |
| **Payments** | 4 | Create orders, verify payments, history |
| **Chat** | 3 | Conversations, messages, send |
| **Reviews** | 3 | Create, view reviews |
| **AI** | 2 | Generate ideas, suggestions |
| **Admin** | 8 | User management, analytics, disputes |
| **TOTAL** | **37** | Complete API coverage |

---

## 🧪 Testing with cURL

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

### Create Project (with token)
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "E-commerce Website",
    "description": "A full-stack e-commerce platform",
    "technology": ["React", "Node.js", "MongoDB"],
    "budget": 5000,
    "deadline": "2024-06-30"
  }'
```

---

## 📚 Documentation

- **Complete API Docs:** `API_DOCUMENTATION.md`
- **Setup Guide:** `SUPABASE_SETUP.md`
- **Quick Start:** `SUPABASE_QUICKSTART.md`
- **Project Summary:** `PROJECT_SUMMARY.md`

---

## 🎯 Roles & Permissions

| Endpoint | Student | Developer | Admin |
|----------|---------|-----------|-------|
| Register | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ |
| Create Project | ✅ | ❌ | ✅ |
| Browse Projects | ✅ | ✅ | ✅ |
| Send Proposal | ❌ | ✅ | ✅ |
| Accept Proposal | ✅ | ❌ | ✅ |
| Make Payment | ✅ | ❌ | ✅ |
| View Earnings | ❌ | ✅ | ✅ |
| Admin Dashboard | ❌ | ❌ | ✅ |

---

**🎉 All 37 endpoints are ready to use!**

