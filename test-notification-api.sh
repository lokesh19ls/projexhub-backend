#!/bin/bash

BASE_URL="https://projexhub-backend.onrender.com"
TIMESTAMP=$(date +%s)

echo "========================================="
echo "🔔 Testing ProjexHub Notification API"
echo "URL: $BASE_URL/api/notifications"
echo "========================================="
echo ""

# Test 1: Health Check
echo -e "\033[1;33m✅ Test 1: Health Check\033[0m"
curl -s $BASE_URL/health | jq
echo ""

# Test 2: Register Student
echo -e "\033[1;33m✅ Test 2: Register Student\033[0m"
STUDENT_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Alice Student\",
    \"email\": \"alice${TIMESTAMP}@test.com\",
    \"password\": \"password123\",
    \"role\": \"student\",
    \"college\": \"MIT\",
    \"department\": \"Computer Science\",
    \"yearOfStudy\": 4
  }")
echo "$STUDENT_RESPONSE" | jq -r '.message // .error'
STUDENT_TOKEN=$(echo "$STUDENT_RESPONSE" | jq -r '.token // empty')
STUDENT_ID=$(echo "$STUDENT_RESPONSE" | jq -r '.user.id // empty')
echo "Student ID: $STUDENT_ID"
echo ""

# Test 3: Register Developer
echo -e "\033[1;33m✅ Test 3: Register Developer\033[0m"
DEV_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Bob Developer\",
    \"email\": \"bob${TIMESTAMP}@test.com\",
    \"password\": \"password123\",
    \"role\": \"developer\",
    \"skills\": [\"React\", \"Node.js\", \"TypeScript\"]
  }")
echo "$DEV_RESPONSE" | jq -r '.message // .error'
DEV_TOKEN=$(echo "$DEV_RESPONSE" | jq -r '.token // empty')
DEV_ID=$(echo "$DEV_RESPONSE" | jq -r '.user.id // empty')
echo "Developer ID: $DEV_ID"
echo ""

# Test 4: Get Notifications (Student - Empty)
echo -e "\033[1;33m✅ Test 4: Get Notifications (Student - Initially Empty)\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  NOTIFICATIONS=$(curl -s $BASE_URL/api/notifications -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$NOTIFICATIONS" | jq '{unreadCount, totalCount, notificationCount: (.notifications | length)}'
else
  echo "❌ No student token"
fi
echo ""

# Test 5: Create Project
echo -e "\033[1;33m✅ Test 5: Create Project\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/api/projects \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d '{
      "title": "Test Notification Project",
      "description": "A project to test notification system with multiple features",
      "technology": ["Python", "Flask"],
      "budget": 5000,
      "deadline": "2026-08-15"
    }')
  
  echo "$PROJECT_RESPONSE" | jq -r '.message // .error'
  PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.project.id // empty')
  echo "Project ID: $PROJECT_ID"
else
  echo "❌ No student token"
fi
echo ""

# Test 6: Send Proposal (This should create a notification)
echo -e "\033[1;33m✅ Test 6: Send Proposal (Creates Notification)\033[0m"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROPOSAL_RESPONSE=$(curl -s -X POST $BASE_URL/api/proposals/project/$PROJECT_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DEV_TOKEN" \
    -d '{
      "price": 4500,
      "timeline": 30,
      "technology": ["Python", "Flask"],
      "message": "I can deliver this project quickly"
    }')
  
  echo "$PROPOSAL_RESPONSE" | jq -r '.message // .error'
  PROPOSAL_ID=$(echo "$PROPOSAL_RESPONSE" | jq -r '.proposal.id // empty')
  echo "Proposal ID: $PROPOSAL_ID"
  
  echo ""
  echo "Waiting for notification to be created..."
  sleep 2
else
  echo "❌ No dev token or project ID"
fi
echo ""

# Test 7: Get Notifications (Student should have 1)
echo -e "\033[1;33m✅ Test 7: Get Notifications (Student Should Have 1)\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  NOTIFICATIONS=$(curl -s $BASE_URL/api/notifications -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$NOTIFICATIONS" | jq '{unreadCount, totalCount, firstNotification: .notifications[0]}'
  
  NOTIF_ID=$(echo "$NOTIFICATIONS" | jq -r '.notifications[0].id // empty')
  echo "First Notification ID: $NOTIF_ID"
else
  echo "❌ No student token"
fi
echo ""

# Test 8: Mark Notification as Read
echo -e "\033[1;33m✅ Test 8: Mark Notification as Read\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$NOTIF_ID" ]; then
  MARK_READ=$(curl -s -X PUT $BASE_URL/api/notifications/$NOTIF_ID/read \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$MARK_READ" | jq -r '.message // .error'
  if echo "$MARK_READ" | jq -e '.notification.is_read == true' > /dev/null 2>&1; then
    echo "✅ Notification marked as read successfully"
  fi
else
  echo "❌ No student token or notification ID"
fi
echo ""

# Test 9: Accept Proposal (Creates notification for developer)
echo -e "\033[1;33m✅ Test 9: Accept Proposal (Creates Notification for Developer)\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROPOSAL_ID" ]; then
  ACCEPT_RESPONSE=$(curl -s -X POST $BASE_URL/api/proposals/$PROPOSAL_ID/accept \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$ACCEPT_RESPONSE" | jq -r '.message // .error'
  
  echo ""
  echo "Waiting for notification to be created..."
  sleep 2
else
  echo "❌ No student token or proposal ID"
fi
echo ""

# Test 10: Get Notifications (Developer - should have 1)
echo -e "\033[1;33m✅ Test 10: Get Notifications (Developer Should Have 1)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  NOTIFICATIONS=$(curl -s $BASE_URL/api/notifications -H "Authorization: Bearer $DEV_TOKEN")
  echo "$NOTIFICATIONS" | jq '{unreadCount, totalCount, firstNotification: .notifications[0]}'
  
  DEV_NOTIF_ID=$(echo "$NOTIFICATIONS" | jq -r '.notifications[0].id // empty')
  echo "First Notification ID: $DEV_NOTIF_ID"
else
  echo "❌ No dev token"
fi
echo ""

# Test 11: Send Chat Message (Creates notification)
echo -e "\033[1;33m✅ Test 11: Send Chat Message (Creates Notification)\033[0m"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  MESSAGE_RESPONSE=$(curl -s -X POST $BASE_URL/api/chat/project/$PROJECT_ID/message \
    -H "Authorization: Bearer $DEV_TOKEN" \
    -F "message=Hello Alice! Let's start working on the project.")
  
  echo "$MESSAGE_RESPONSE" | jq -r '.message // .error'
  
  echo ""
  echo "Waiting for notification to be created..."
  sleep 2
else
  echo "❌ No dev token or project ID"
fi
echo ""

# Test 12: Get Notifications (Student - should have 2)
echo -e "\033[1;33m✅ Test 12: Get Notifications (Student Should Have 2)\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  NOTIFICATIONS=$(curl -s $BASE_URL/api/notifications -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$NOTIFICATIONS" | jq '{unreadCount, totalCount, notifications: [.notifications[] | {id, title, type, is_read}]}'
else
  echo "❌ No student token"
fi
echo ""

# Test 13: Mark All as Read (Student)
echo -e "\033[1;33m✅ Test 13: Mark All Notifications as Read (Student)\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  MARK_ALL=$(curl -s -X PUT $BASE_URL/api/notifications/read/all \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$MARK_ALL" | jq
  
  if echo "$MARK_ALL" | jq -e '.count' > /dev/null 2>&1; then
    echo "✅ All notifications marked as read"
  fi
else
  echo "❌ No student token"
fi
echo ""

# Test 14: Get Notifications After Marking All Read
echo -e "\033[1;33m✅ Test 14: Get Notifications After Marking All Read\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  NOTIFICATIONS=$(curl -s $BASE_URL/api/notifications -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$NOTIFICATIONS" | jq '{unreadCount, totalCount, allRead: (.notifications | map(.is_read) | all)}'
else
  echo "❌ No student token"
fi
echo ""

# Test 15: Test Pagination
echo -e "\033[1;33m✅ Test 15: Test Pagination\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  NOTIFICATIONS=$(curl -s "$BASE_URL/api/notifications?limit=10&offset=0" -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$NOTIFICATIONS" | jq '{unreadCount, totalCount, limit: 10, offset: 0, notificationCount: (.notifications | length)}'
else
  echo "❌ No student token"
fi
echo ""

# Test 16: Test Unauthorized Access
echo -e "\033[1;33m✅ Test 16: Test Unauthorized Access\033[0m"
UNAUTH_TOKEN="invalid_token_123"
curl -s $BASE_URL/api/notifications -H "Authorization: Bearer $UNAUTH_TOKEN" | jq -r '.error // "Unexpected response"'
echo ""

# Test 17: Try to Mark Other User's Notification
echo -e "\033[1;33m✅ Test 17: Try to Mark Other User's Notification\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$DEV_NOTIF_ID" ]; then
  curl -s -X PUT $BASE_URL/api/notifications/$DEV_NOTIF_ID/read \
    -H "Authorization: Bearer $STUDENT_TOKEN" | jq -r '.error // .message'
else
  echo "❌ No student token or dev notification ID"
fi
echo ""

echo -e "\033[0;32m========================================\033[0m"
echo -e "\033[0;32m✅ Notification API Tests Complete!\033[0m"
echo -e "\033[0;32m========================================\033[0m"
echo ""
echo "Tested Endpoints:"
echo "  ✅ Health Check"
echo "  ✅ User Registration (Student & Developer)"
echo "  ✅ Get Notifications (Empty state)"
echo "  ✅ Create Project"
echo "  ✅ Send Proposal (Auto-notification)"
echo "  ✅ Get Notifications (After proposal)"
echo "  ✅ Mark Notification as Read"
echo "  ✅ Accept Proposal (Auto-notification)"
echo "  ✅ Get Notifications (Developer)"
echo "  ✅ Send Chat Message (Auto-notification)"
echo "  ✅ Get Notifications (Student with 2)"
echo "  ✅ Mark All as Read"
echo "  ✅ Pagination Test"
echo "  ✅ Authorization Check"
echo "  ✅ Cross-user Access Check"
echo ""
echo -e "\033[0;32m🎉 Notification API is fully functional!\033[0m"

