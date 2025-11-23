# Admin API Documentation

This document describes all the admin panel API endpoints.

**Base URL:** `https://projexhub-backend.onrender.com/api/admin`

**Authentication:** All endpoints (except login) require Bearer token in Authorization header:

```
Authorization: Bearer <adminToken>
```

---

## 🔐 Authentication

### 1. Admin Login

- **Endpoint:** `POST /admin/login`
- **Authentication:** Not required

- **Request Body:**

  ```json
  {
    "email": "admin@workzo.com",
    "password": "password123"
  }
  ```

- **Response:**

  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@workzo.com",
      "role": "admin"
    }
  }
  ```

---

## 📊 Dashboard

### 2. Get Dashboard Statistics

- **Endpoint:** `GET /admin/dashboard/stats`

- **Response:**

  ```json
  {
    "data": {
      "totalUsers": 1234,
      "totalStudents": 800,
      "totalDevelopers": 434,
      "activeProjects": 456,
      "totalRevenue": 1250000,
      "totalCommission": 12500,
      "pendingVerifications": 12,
      "pendingProjects": 8,
      "activeDisputes": 3,
      "recentActivity": [
        {
          "type": "user_registered",
          "message": "New user registered",
          "details": "John Doe - Developer",
          "timestamp": "2025-11-23T06:41:00Z"
        }
      ]
    }
  }
  ```

---

## 👥 User Management

### 3. List Users

- **Endpoint:** `GET /admin/users`

- **Query Parameters:**

  - `role` (optional): `student` | `developer`
  - `isVerified` (optional): `true` | `false`
  - `isActive` (optional): `true` | `false`
  - `page` (optional): number (default: 1)
  - `limit` (optional): number (default: 20)
  - `search` (optional): string (searches name, email, phone)

- **Example:** `GET /admin/users?role=developer&isVerified=true&page=1&limit=20&search=john`

- **Response:**

  ```json
  {
    "data": [
      {
        "id": "1",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "role": "developer",
        "isVerified": true,
        "isActive": true,
        "rating": 4.5,
        "totalProjects": 15,
        "profilePhoto": "https://...",
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
  ```

### 4. Get User Details

- **Endpoint:** `GET /admin/users/:userId`

- **Response:**

  ```json
  {
    "data": {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "developer",
      "isVerified": true,
      "isActive": true,
      "rating": 4.5,
      "totalProjects": 15,
      "profilePhoto": "https://...",
      "createdAt": "2025-01-15T10:00:00Z"
    }
  }
  ```

### 5. Verify User

- **Endpoint:** `POST /admin/users/:userId/verify`

- **Response:** `200 OK`

  ```json
  {
    "message": "User verified successfully"
  }
  ```

### 6. Deactivate User

- **Endpoint:** `POST /admin/users/:userId/deactivate`

- **Response:** `200 OK`

  ```json
  {
    "message": "User deactivated successfully"
  }
  ```

---

## 📁 Project Management

### 7. List Projects

- **Endpoint:** `GET /admin/projects`

- **Query Parameters:**

  - `status` (optional): `open` | `in_progress` | `completed` | `cancelled`
  - `page` (optional): number (default: 1)
  - `limit` (optional): number (default: 20)
  - `search` (optional): string (searches title, description, student name)

- **Example:** `GET /admin/projects?status=in_progress&page=1&limit=20&search=ecommerce`

- **Response:**

  ```json
  {
    "data": [
      {
        "id": "1",
        "title": "E-commerce Website",
        "description": "Build a full-stack e-commerce platform...",
        "studentId": "2",
        "studentName": "Jane Smith",
        "budget": 50000,
        "status": "in_progress",
        "technologies": ["React", "Node.js", "MongoDB"],
        "proposalsCount": 5,
        "createdAt": "2025-01-15T10:00:00Z",
        "deadline": "2025-02-15T10:00:00Z"
      }
    ],
    "total": 200,
    "page": 1,
    "limit": 20,
    "totalPages": 10
  }
  ```

### 8. Get Project Details

- **Endpoint:** `GET /admin/projects/:projectId`

- **Response:**

  ```json
  {
    "data": {
      "id": "1",
      "title": "E-commerce Website",
      "description": "Build a full-stack e-commerce platform...",
      "studentId": "2",
      "studentName": "Jane Smith",
      "budget": 50000,
      "status": "in_progress",
      "technologies": ["React", "Node.js", "MongoDB"],
      "proposalsCount": 5,
      "createdAt": "2025-01-15T10:00:00Z",
      "deadline": "2025-02-15T10:00:00Z"
    }
  }
  ```

### 9. Update Project Status

- **Endpoint:** `PUT /admin/projects/:projectId`

- **Request Body:**

  ```json
  {
    "status": "in_progress"
  }
  ```

- **Response:** `200 OK`

  ```json
  {
    "message": "Project status updated successfully"
  }
  ```

---

## 💳 Payment Management

### 10. List Payments

- **Endpoint:** `GET /admin/payments`

- **Query Parameters:**

  - `status` (optional): `completed` | `pending` | `failed` | `refunded`
  - `paymentType` (optional): `advance` | `full` | `milestone`
  - `page` (optional): number (default: 1)
  - `limit` (optional): number (default: 20)

- **Example:** `GET /admin/payments?status=completed&paymentType=full&page=1&limit=20`

- **Response:**

  ```json
  {
    "data": [
      {
        "id": "1",
        "projectId": "5",
        "projectTitle": "E-commerce Website",
        "studentId": "2",
        "studentName": "Jane Smith",
        "developerId": "3",
        "developerName": "John Doe",
        "grossAmount": 35000,
        "razorpayFee": 826,
        "commissionAmount": 350,
        "netAmount": 33824,
        "status": "completed",
        "paymentMethod": "UPI",
        "paymentType": "full",
        "createdAt": "2025-01-15T10:00:00Z",
        "razorpayPaymentId": "pay_ABC123XYZ"
      }
    ],
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
  ```

**Important:** Payment breakdown calculation:

- `grossAmount`: Full payment amount (₹35,000)
- `razorpayFee`: Gateway fees (2.36% of grossAmount = ₹826)
- `commissionAmount`: Platform commission = 1% of grossAmount (₹350)
- `netAmount`: Amount developer receives = grossAmount - razorpayFee - commissionAmount (₹33,824)

### 11. Get Payment Details

- **Endpoint:** `GET /admin/payments/:paymentId`

- **Response:**

  ```json
  {
    "data": {
      "id": "1",
      "projectId": "5",
      "projectTitle": "E-commerce Website",
      "studentId": "2",
      "studentName": "Jane Smith",
      "developerId": "3",
      "developerName": "John Doe",
      "grossAmount": 35000,
      "razorpayFee": 826,
      "commissionAmount": 350,
      "netAmount": 33824,
      "status": "completed",
      "paymentMethod": "UPI",
      "paymentType": "full",
      "createdAt": "2025-01-15T10:00:00Z",
      "razorpayPaymentId": "pay_ABC123XYZ"
    }
  }
  ```

### 12. Refund Payment

- **Endpoint:** `POST /admin/payments/:paymentId/refund`

- **Response:** `200 OK`

  ```json
  {
    "message": "Payment refunded successfully"
  }
  ```

---

## ⚖️ Dispute Management

### 13. List Disputes

- **Endpoint:** `GET /admin/disputes`

- **Query Parameters:**

  - `status` (optional): `pending` | `resolved` | `closed`
  - `raisedBy` (optional): `student` | `developer`
  - `page` (optional): number (default: 1)
  - `limit` (optional): number (default: 20)

- **Example:** `GET /admin/disputes?status=pending&raisedBy=student&page=1&limit=20`

- **Response:**

  ```json
  {
    "data": [
      {
        "id": "1",
        "projectId": "5",
        "projectTitle": "E-commerce Website",
        "studentId": "2",
        "studentName": "Jane Smith",
        "developerId": "3",
        "developerName": "John Doe",
        "reason": "Quality Issues",
        "description": "The delivered product does not meet the requirements...",
        "status": "pending",
        "raisedBy": "student",
        "resolution": null,
        "resolutionNotes": null,
        "createdAt": "2025-01-15T10:00:00Z",
        "resolvedAt": null
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
  ```

### 14. Get Dispute Details

- **Endpoint:** `GET /admin/disputes/:disputeId`

- **Response:**

  ```json
  {
    "data": {
      "id": "1",
      "projectId": "5",
      "projectTitle": "E-commerce Website",
      "studentId": "2",
      "studentName": "Jane Smith",
      "developerId": "3",
      "developerName": "John Doe",
      "reason": "Quality Issues",
      "description": "The delivered product does not meet the requirements...",
      "status": "resolved",
      "raisedBy": "student",
      "resolution": "favor_student",
      "resolutionNotes": "Refund issued due to quality concerns",
      "createdAt": "2025-01-15T10:00:00Z",
      "resolvedAt": "2025-01-16T14:30:00Z"
    }
  }
  ```

### 15. Resolve Dispute

- **Endpoint:** `POST /admin/disputes/:disputeId/resolve`

- **Request Body:**

  ```json
  {
    "resolution": "favor_student",
    "notes": "Refund issued due to quality concerns"
  }
  ```

- **Resolution Options:**

  - `favor_student`: Refund payment to student
  - `favor_developer`: Release payment to developer
  - `partial`: Split payment between both parties
  - `dismiss`: No action needed

- **Response:** `200 OK`

  ```json
  {
    "message": "Dispute resolved successfully"
  }
  ```

---

## 📋 Summary

### Total Endpoints: 15

**By Category:**

- Authentication: 1 endpoint
- Dashboard: 1 endpoint
- Users: 4 endpoints
- Projects: 3 endpoints
- Payments: 3 endpoints
- Disputes: 3 endpoints

### Common Response Patterns

**Paginated Response:**

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

**Single Item Response:**

```json
{
  "data": { ... }
}
```

**Error Response:**

```json
{
  "message": "Error message here",
  "error": "Error code"
}
```

### HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## 🔧 Testing

You can test these endpoints using:

- Postman
- cURL
- Browser DevTools Network tab
- API testing tools

**Example cURL:**

```bash
# Login
curl -X POST "https://projexhub-backend.onrender.com/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@workzo.com","password":"password123"}'

# Get Dashboard Stats (replace TOKEN with actual token)
curl -X GET "https://projexhub-backend.onrender.com/api/admin/dashboard/stats" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📝 Notes

1. **Commission Calculation**: The backend calculates `commissionAmount` as 1% of `grossAmount` for each payment.

2. **Razorpay Fee**: Calculated as 2.36% of `grossAmount` (Razorpay's standard transaction fee).

3. **Pagination**: All list endpoints support pagination with `page` and `limit` parameters.

4. **Search**: User and Project list endpoints support search functionality.

5. **Filtering**: Most list endpoints support filtering by status and other relevant fields.

6. **Authentication**: All endpoints (except login) require a valid admin token in the Authorization header.

7. **CORS**: The backend allows CORS requests from configured frontend domains.

8. **Dispute Status Mapping**: The database uses `open` status, but the API returns `pending` for consistency with the frontend.

