# ⭐ Reviews API Documentation

**Base URL:** `https://projexhub-backend.onrender.com/api`

---

## Overview

The Reviews API allows students and developers to rate each other after a project is completed. Reviews affect user ratings and are visible on profile and proposal screens.

**Review rules:**
- Only project participants (student and assigned developer) can submit reviews.
- Project must be marked as `completed` before a review can be created.
- Each participant can submit only one review per project.
- Ratings range from 1 to 5 stars, with an optional comment (max 500 chars).

---

## 🎯 Endpoints

### 1. Create Review

**Endpoint:** `POST /api/reviews/project/:projectId`

**Description:** Submit a review for a completed project. The reviewee is determined automatically:
- Student → reviews developer
- Developer → reviews student

**Authorization:** Student or Developer assigned to the project

**URL Parameters:**
- `projectId` (number) – ID of the completed project

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great collaboration, delivered ahead of schedule!"
}
```

**Request Fields:**
- `rating` (number, required) – 1 to 5
- `comment` (string, optional) – up to 500 characters

**Example Request:**
```bash
curl -X POST https://projexhub-backend.onrender.com/api/reviews/project/12 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Excellent communication and timely delivery!"
  }'
```

**Response (201 Created):**
```json
{
  "message": "Review submitted successfully",
  "review": {
    "id": 45,
    "project_id": 12,
    "reviewer_id": 30,
    "reviewee_id": 18,
    "rating": 5,
    "comment": "Excellent communication and timely delivery!",
    "created_at": "2025-11-02T08:45:12.123Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` – Project not completed, duplicate review, or missing data
- `403 Forbidden` – Reviewer not part of the project
- `404 Not Found` – Project not found or proposal not accepted

---

### 2. Get User Reviews

**Endpoint:** `GET /api/reviews/user/:userId`

**Description:** Fetch all reviews received by a user (developer or student). Useful for viewing developer reviews before accepting proposals.

**Authorization:** Any authenticated user

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/reviews/user/18 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": 45,
    "project_id": 12,
    "reviewer_id": 30,
    "reviewer_name": "Alice Student",
    "profile_photo": "https://...",
    "project_title": "AI Chatbot Assistant",
    "rating": 5,
    "comment": "Very professional and responsive!",
    "created_at": "2025-11-02T08:45:12.123Z"
  },
  {
    "id": 39,
    "project_id": 9,
    "reviewer_id": 26,
    "reviewer_name": "John Student",
    "project_title": "Inventory Management System",
    "rating": 4,
    "comment": "Delivered on time with minor revisions",
    "created_at": "2025-10-28T10:12:54.627Z"
  }
]
```

---

### 3. Get Project Reviews

**Endpoint:** `GET /api/reviews/project/:projectId/reviews`

**Description:** Returns all reviews associated with a project. Useful for ensuring both participants have submitted reviews or to show review history.

**Authorization:** Any authenticated user

**Example Request:**
```bash
curl -X GET https://projexhub-backend.onrender.com/api/reviews/project/12/reviews \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**
```json
[
  {
    "id": 45,
    "reviewer_id": 30,
    "reviewer_name": "Alice Student",
    "rating": 5,
    "comment": "Excellent communication!",
    "created_at": "2025-11-02T08:45:12.123Z"
  },
  {
    "id": 46,
    "reviewer_id": 18,
    "reviewer_name": "Bob Developer",
    "rating": 5,
    "comment": "Student provided clear requirements and prompt feedback.",
    "created_at": "2025-11-02T09:02:47.531Z"
  }
]
```

---

## 🔄 Review Lifecycle

1. **Student completes project** → Project status set to `completed`.
2. **Review Developer button** appears → Student calls `POST /api/reviews/project/:projectId`.
3. **Developer receives review notification** (optional integration).
4. **Developer reviews student** via same endpoint.
5. **Ratings updated automatically** for both parties.
6. **Frontend fetches reviews** using `GET /api/reviews/user/:userId` and `GET /api/reviews/project/:projectId/reviews`.

---

## ✅ Summary of Business Rules

- ✔ Only project participants can create reviews.
- ✔ Project must be completed before reviews are allowed.
- ✔ Each participant can submit only one review per project.
- ✔ Ratings are aggregated automatically in the `users` table.
- ✔ Comments are optional (up to 500 characters).

---

## 📚 Related Endpoints

- `PUT /api/dev/projects/:projectId/progress` – Marks project as completed when developer finishes work.
- `GET /api/projects/:id` – Shows current project status.
- `GET /api/projects/:id/progress` – Student progress tracking endpoint.

---

## 🧪 Testing Tips

- Ensure the project status is `completed` before testing `POST /api/reviews/project/:projectId`.
- Use `GET /api/reviews/user/:userId` to verify review visibility on developer profile screens.
- Use `GET /api/reviews/project/:projectId/reviews` to confirm both student and developer reviews are present.

---

## 📞 Support

- **Live API:** https://projexhub-backend.onrender.com/api  
- **Documentation:** `PAYMENT_API.md`, `DEVELOPER_HOME_API.md`, `PROGRESS_TRACKING_API.md`


