# 💳 Payment API Documentation

**Base URL:** `https://projexhub-backend.onrender.com/api`

---

## Overview

The Payment API allows students to make payments for projects using Razorpay integration. It supports three payment types: Advance (50%), Full Payment, and Milestone Payments (20%, 50%, 100%). The API includes payment verification, history tracking, and milestone payment management.

---

## 🎯 Endpoints

### 1. Create Payment Order

**Endpoint:** `POST /api/payments/project/:projectId/order`

**Description:** Create a Razorpay payment order for a project. Returns Razorpay order details required for frontend payment integration.

**Authorization:** Student or Admin only

**URL Parameters:**
- `projectId` (number) - The project ID

**Request Body:**
```json
{
  "paymentMethod": "upi",
  "paymentType": "milestone",
  "milestonePercentage": 20
}
```

**Request Fields:**
- `paymentMethod` (string, required) - Payment method: `"card"`, `"upi"`, `"netbanking"`, or `"wallet"`
- `paymentType` (string, required) - Payment type: `"advance"`, `"full"`, or `"milestone"`
- `milestonePercentage` (number, required if paymentType is "milestone") - Milestone percentage: `20`, `50`, or `100`

**Example Request:**
```bash
curl -X POST https://projexhub-backend.onrender.com/api/payments/project/1/order \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "upi",
    "paymentType": "milestone",
    "milestonePercentage": 20
  }'
```

**Response (201 Created):**
```json
{
  "payment": {
    "id": 1,
    "project_id": 1,
    "student_id": 5,
    "developer_id": 10,
    "amount": "2400.00",
    "commission_amount": "240.00",
    "net_amount": "2160.00",
    "payment_method": "upi",
    "payment_type": "milestone",
    "milestone_percentage": 20,
    "razorpay_order_id": "order_ABC123",
    "status": "pending",
    "created_at": "2025-01-20T10:00:00.000Z",
    "updated_at": "2025-01-20T10:00:00.000Z"
  },
  "razorpayOrder": {
    "id": "order_ABC123",
    "entity": "order",
    "amount": 240000,
    "amount_paid": 0,
    "amount_due": 240000,
    "currency": "INR",
    "receipt": "projexhub_1_1737350400000",
    "status": "created",
    "attempts": 0,
    "created_at": 1737350400
  }
}
```

**Payment Amount Calculation:**
- **Advance Payment:** 50% of project price
- **Full Payment:** 100% of project price
- **Milestone Payment:** Project price × milestone percentage (20%, 50%, or 100%)

**Commission:** 10% commission is deducted from each payment. Developer receives net amount (90% of payment).

**Error Responses:**

**400 Bad Request**
```json
{
  "error": "Milestone percentage must be 20, 50, or 100"
}
```

```json
{
  "error": "20% milestone payment already completed"
}
```

**403 Forbidden**
```json
{
  "error": "Unauthorized to make payment for this project"
}
```

**503 Service Unavailable**
```json
{
  "error": "Payment gateway not configured. Please contact support."
}
```

---

### 2. Verify Payment

**Endpoint:** `POST /api/payments/verify`

**Description:** Verify a Razorpay payment after successful transaction. Updates payment status and sends notifications.

**Authorization:** Required (any authenticated user)

**Request Body:**
```json
{
  "razorpay_order_id": "order_ABC123",
  "razorpay_payment_id": "pay_XYZ789",
  "razorpay_signature": "signature_string"
}
```

**Request Fields:**
- `razorpay_order_id` (string, required) - Razorpay order ID
- `razorpay_payment_id` (string, required) - Razorpay payment ID
- `razorpay_signature` (string, required) - Razorpay payment signature for verification

**Example Request:**
```bash
curl -X POST https://projexhub-backend.onrender.com/api/payments/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_ABC123",
    "razorpay_payment_id": "pay_XYZ789",
    "razorpay_signature": "signature_string"
  }'
```

**Response (200 OK):**
```json
{
  "message": "Payment verified successfully",
  "payment": {
    "id": 1,
    "project_id": 1,
    "status": "completed",
    "razorpay_payment_id": "pay_XYZ789",
    "updated_at": "2025-01-20T10:05:00.000Z"
  }
}
```

**What happens on verification:**
1. Payment signature is verified
2. Payment status updated to "completed"
3. If milestone payment, project progress percentage is updated
4. Notification sent to developer about payment received

**Error Responses:**

**400 Bad Request**
```json
{
  "error": "Invalid payment signature"
}
```

**404 Not Found**
```json
{
  "error": "Payment not found"
}
```

---

### 3. Get Payment History

**Endpoint:** `GET /api/payments/history`

**Description:** Get payment history for the authenticated user (student or developer).

**Authorization:** Required

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/payments/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "projectId": 1,
    "projectTitle": "E-commerce Website",
    "projectStatus": "in_progress",
    "amount": 2400,
    "netAmount": 2160,
    "commissionAmount": 240,
    "paymentMethod": "upi",
    "paymentType": "milestone",
    "milestonePercentage": 20,
    "milestoneLabel": "20% Milestone Payment",
    "status": "completed",
    "razorpayOrderId": "order_ABC123",
    "razorpayPaymentId": "pay_XYZ789",
    "createdAt": "2025-01-20T10:00:00.000Z",
    "updatedAt": "2025-01-20T10:05:00.000Z"
  },
  {
    "id": 2,
    "projectId": 1,
    "projectTitle": "E-commerce Website",
    "amount": 6000,
    "paymentMethod": "card",
    "paymentType": "advance",
    "milestonePercentage": 0,
    "milestoneLabel": "Advance Payment (50%)",
    "status": "completed",
    "createdAt": "2025-01-15T09:00:00.000Z",
    "updatedAt": "2025-01-15T09:03:00.000Z"
  }
]
```

**Response Fields:**
- Payments are sorted by most recent first
- Includes milestone labels for easy identification
- Shows project status for context

---

### 4. Get Project Payments

**Endpoint:** `GET /api/payments/project/:projectId`

**Description:** Get all payments for a specific project with milestone tracking and payment statistics.

**Authorization:** Student or Admin only (must own the project)

**URL Parameters:**
- `projectId` (number) - The project ID

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/payments/project/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "message": "Project payments retrieved successfully",
  "data": {
    "project": {
      "id": 1,
      "title": "E-commerce Website",
      "price": 12000,
      "totalPaid": 8400,
      "remainingAmount": 3600,
      "totalPending": 0
    },
    "payments": [
      {
        "id": 1,
        "amount": 2400,
        "netAmount": 2160,
        "commissionAmount": 240,
        "paymentMethod": "upi",
        "paymentType": "milestone",
        "milestonePercentage": 20,
        "status": "completed",
        "razorpayOrderId": "order_ABC123",
        "createdAt": "2025-01-20T10:00:00.000Z",
        "updatedAt": "2025-01-20T10:05:00.000Z"
      }
    ],
    "milestones": {
      "20": {
        "paid": true,
        "amount": 2400,
        "paidAt": "2025-01-20T10:05:00.000Z",
        "paymentId": 1
      },
      "50": {
        "paid": false,
        "amount": 6000,
        "paidAt": null,
        "paymentId": null
      },
      "100": {
        "paid": false,
        "amount": 12000,
        "paidAt": null,
        "paymentId": null
      }
    },
    "advancePayment": {
      "paid": false,
      "amount": 6000,
      "paidAt": null,
      "paymentId": null
    },
    "fullPayment": null
  }
}
```

**Response Fields:**
- `project` - Project payment summary
- `payments` - All payment transactions for the project
- `milestones` - Milestone payment tracking (20%, 50%, 100%)
- `advancePayment` - Advance payment status
- `fullPayment` - Full payment status (null if not paid)

**Error Responses:**

**404 Not Found**
```json
{
  "error": "Project not found or unauthorized"
}
```

---

### 5. Get Payment Screen Data

**Endpoint:** `GET /api/payments/project/:projectId/screen`

**Description:** Get all data needed for the payment screen including project details, payment options, and calculated amounts.

**Authorization:** Student or Admin only (must own the project)

**URL Parameters:**
- `projectId` (number) - The project ID

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/payments/project/1/screen \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "message": "Payment screen data retrieved successfully",
  "data": {
    "project": {
      "id": 1,
      "title": "E-commerce Website",
      "budget": 5000,
      "proposedPrice": 4000
    },
    "paymentSummary": {
      "totalPaid": 0,
      "remainingAmount": 4000,
      "totalAmount": 4000
    },
    "paymentTypes": [
      {
        "type": "advance",
        "label": "Advance Payment",
        "description": "50% advance payment to start the project",
        "amount": 2000,
        "available": true
      },
      {
        "type": "full",
        "label": "Full Payment",
        "description": "Complete project payment",
        "amount": 4000,
        "available": true
      },
      {
        "type": "milestone",
        "label": "Milestone Payment",
        "description": "Pay based on project milestones",
        "milestones": [
          {
            "percentage": 20,
            "amount": 800,
            "available": true
          },
          {
            "percentage": 50,
            "amount": 2000,
            "available": true
          },
          {
            "percentage": 100,
            "amount": 4000,
            "available": true
          }
        ]
      }
    ],
    "paymentMethods": [
      {
        "method": "upi",
        "label": "UPI",
        "available": true
      },
      {
        "method": "card",
        "label": "Card",
        "available": true
      },
      {
        "method": "wallet",
        "label": "Wallet",
        "available": true
      },
      {
        "method": "netbanking",
        "label": "Netbanking",
        "available": true
      }
    ],
    "hasAcceptedProposal": true
  }
}
```

**Response Fields:**
- `project` - Project budget and proposed price
- `paymentSummary` - Total paid, remaining amount, and total amount
- `paymentTypes` - Available payment types with calculated amounts
- `paymentMethods` - Available payment methods
- `hasAcceptedProposal` - Whether project has an accepted proposal

**Note:** Payment types are marked as `available: false` if:
- They have already been paid
- A conflicting payment type exists (e.g., advance and full payment are mutually exclusive)

**Error Responses:**

**400 Bad Request**
```json
{
  "error": "Project must have an accepted proposal before making payment"
}
```

**404 Not Found**
```json
{
  "error": "Project not found or unauthorized"
}
```

---

### 6. Get Payment Summary

**Endpoint:** `GET /api/payments/summary`

**Description:** Get payment statistics and summary for a student.

**Authorization:** Student or Admin only

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/payments/summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
{
  "message": "Payment summary retrieved successfully",
  "data": {
    "summary": {
      "totalPaid": 24000,
      "totalPending": 1200,
      "totalFailed": 600,
      "totalRefunded": 0,
      "totalTransactions": 15,
      "completedTransactions": 12
    },
    "byType": {
      "advance": 3,
      "full": 2,
      "milestone": 7
    },
    "recentPayments": [
      {
        "id": 15,
        "projectId": 5,
        "projectTitle": "Mobile App",
        "amount": 2400,
        "paymentType": "milestone",
        "milestonePercentage": 20,
        "status": "completed",
        "createdAt": "2025-01-20T10:00:00.000Z"
      }
    ]
  }
}
```

**Response Fields:**
- `summary` - Overall payment statistics
- `byType` - Payment count by type
- `recentPayments` - Last 10 payments (most recent first)

---

## 💰 Payment Types

### 1. Advance Payment
- **Amount:** 50% of project price
- **Purpose:** Initial payment to start the project
- **Status:** Can be made once per project

### 2. Full Payment
- **Amount:** 100% of project price
- **Purpose:** Complete payment upfront
- **Status:** Alternative to advance + milestone payments

### 3. Milestone Payments
- **Amount:** Project price × milestone percentage
- **Milestones:** 20%, 50%, 100%
- **Purpose:** Pay based on project progress
- **Status:** Each milestone can be paid once

**Note:** A project can use either:
- Advance (50%) + Milestone payments (50% total), OR
- Full payment (100%)

---

## 🔒 Authorization

### Student-Only Endpoints
- `POST /api/payments/project/:projectId/order` - Create payment
- `GET /api/payments/project/:projectId` - Get project payments
- `GET /api/payments/summary` - Get payment summary

### All Users
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/history` - Get payment history

---

## 📊 Milestone Payment Tracking

The API automatically tracks milestone payments:
- **20% Milestone:** Paid when project reaches 20% progress
- **50% Milestone:** Paid when project reaches 50% progress  
- **100% Milestone:** Paid when project reaches 100% completion

**Validation:**
- Prevents duplicate milestone payments
- Ensures milestone percentage matches allowed values (20, 50, 100)
- Updates project progress automatically on verification

---

## 🔔 Notifications

When a payment is verified:
- **Developer receives notification:** "Payment Received - ₹[amount]"
- **Payment type:** `"payment"`
- **Related ID:** Payment ID

---

## 🚨 Error Handling

### Common Errors

**400 Bad Request**
- Invalid milestone percentage
- Duplicate milestone payment
- Missing required fields

**403 Forbidden**
- Unauthorized to make payment
- Project ownership mismatch

**404 Not Found**
- Project not found
- Payment not found

**503 Service Unavailable**
- Razorpay not configured
- Payment gateway error

---

## 🔗 Related Endpoints

- `GET /api/projects/:id` - Get project details
- `GET /api/projects/:id/progress` - Get project progress tracking
- `GET /api/dev/projects/:id/progress` - Developer update progress (triggers milestone payments)

---

## 📝 Notes

### Commission Calculation
- Platform takes 10% commission on all payments
- Developer receives 90% (net amount)
- Commission amount is stored separately for admin tracking

### Razorpay Integration
- Uses Razorpay Orders API
- Payment verification using HMAC SHA256 signature
- Supports multiple payment methods (Card, UPI, Netbanking, Wallet)

### Payment Flow
1. Student creates payment order → Gets Razorpay order details
2. Student completes payment on Razorpay → Gets payment ID and signature
3. Student calls verify endpoint → Payment status updated to completed
4. Developer receives notification → Payment reflected in earnings

---

## 🚀 Usage Example

```javascript
// 1. Create payment order
const orderResponse = await fetch('https://projexhub-backend.onrender.com/api/payments/project/1/order', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    paymentMethod: 'upi',
    paymentType: 'milestone',
    milestonePercentage: 20
  })
});

const { payment, razorpayOrder } = await orderResponse.json();

// 2. Initialize Razorpay checkout (Frontend)
const options = {
  key: 'YOUR_RAZORPAY_KEY_ID',
  amount: razorpayOrder.amount,
  currency: razorpayOrder.currency,
  order_id: razorpayOrder.id,
  name: 'ProjexHub',
  handler: function(response) {
    // 3. Verify payment
    verifyPayment(response);
  }
};

// 3. Verify payment
async function verifyPayment(razorpayResponse) {
  const verifyResponse = await fetch('https://projexhub-backend.onrender.com/api/payments/verify', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature
    })
  });

  const result = await verifyResponse.json();
  console.log('Payment verified:', result);
}
```

---

## 📞 Support

**Live API:** https://projexhub-backend.onrender.com/api  
**Documentation:** See `API_DOCUMENTATION.md`

