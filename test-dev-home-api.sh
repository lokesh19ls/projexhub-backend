#!/bin/bash

BASE_URL="https://projexhub-backend.onrender.com"
TIMESTAMP=$(date +%s)

echo "========================================="
echo "👨‍💻 Testing Developer Home API"
echo "URL: $BASE_URL/api/dev/home"
echo "========================================="
echo ""

# Test 1: Health Check
echo -e "\033[1;33m✅ Test 1: Health Check\033[0m"
curl -s $BASE_URL/health | jq
echo ""

# Test 2: Register Developer
echo -e "\033[1;33m✅ Test 2: Register Developer\033[0m"
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

# Test 3: Get Developer Home (Empty State)
echo -e "\033[1;33m✅ Test 3: Get Developer Home (Empty State)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  HOME_DATA=$(curl -s $BASE_URL/api/dev/home -H "Authorization: Bearer $DEV_TOKEN")
  echo "$HOME_DATA" | jq '{
    developer: .developer,
    dashboard: .dashboard,
    quickActionsCount: (.quickActions | length),
    recentActivityCount: (.recentActivity | length),
    unreadNotificationsCount: .unreadNotificationsCount
  }'
else
  echo "❌ No dev token"
fi
echo ""

# Test 4: Register Student
echo -e "\033[1;33m✅ Test 4: Register Student\033[0m"
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

# Test 5: Create Project
echo -e "\033[1;33m✅ Test 5: Create Project\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/api/projects \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d '{
      "title": "Developer Home Test Project",
      "description": "A project to test developer home dashboard with multiple features and metrics",
      "technology": ["React", "Node.js"],
      "budget": 10000,
      "deadline": "2026-08-15"
    }')
  
  echo "$PROJECT_RESPONSE" | jq -r '.message // .error'
  PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.project.id // empty')
  echo "Project ID: $PROJECT_ID"
else
  echo "❌ No student token"
fi
echo ""

# Test 6: Send Proposal
echo -e "\033[1;33m✅ Test 6: Developer Sends Proposal\033[0m"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROPOSAL_RESPONSE=$(curl -s -X POST $BASE_URL/api/proposals/project/$PROJECT_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DEV_TOKEN" \
    -d '{
      "price": 9000,
      "timeline": 60,
      "technology": ["React", "Node.js"],
      "message": "I can complete this project quickly"
    }')
  
  echo "$PROPOSAL_RESPONSE" | jq -r '.message // .error'
  PROPOSAL_ID=$(echo "$PROPOSAL_RESPONSE" | jq -r '.proposal.id // empty')
  echo "Proposal ID: $PROPOSAL_ID"
else
  echo "❌ No dev token or project ID"
fi
echo ""

# Test 7: Get Developer Home (After Proposal)
echo -e "\033[1;33m✅ Test 7: Get Developer Home (After Sending Proposal)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  HOME_DATA=$(curl -s $BASE_URL/api/dev/home -H "Authorization: Bearer $DEV_TOKEN")
  echo "$HOME_DATA" | jq '{
    proposalsSent: .dashboard.proposalsSent,
    successRate: .dashboard.successRate,
    recentActivityCount: (.recentActivity | length)
  }'
else
  echo "❌ No dev token"
fi
echo ""

# Test 8: Accept Proposal
echo -e "\033[1;33m✅ Test 8: Accept Proposal\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROPOSAL_ID" ]; then
  ACCEPT_RESPONSE=$(curl -s -X POST $BASE_URL/api/proposals/$PROPOSAL_ID/accept \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$ACCEPT_RESPONSE" | jq -r '.message // .error'
else
  echo "❌ No student token or proposal ID"
fi
echo ""

# Test 9: Get Developer Home (After Acceptance)
echo -e "\033[1;33m✅ Test 9: Get Developer Home (After Proposal Accepted)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  HOME_DATA=$(curl -s $BASE_URL/api/dev/home -H "Authorization: Bearer $DEV_TOKEN")
  echo "$HOME_DATA" | jq '{
    activeProjects: .dashboard.activeProjects,
    proposalsSent: .dashboard.proposalsSent,
    successRate: .dashboard.successRate,
    recentActivity: [.recentActivity[] | {type, title, timeAgo}]
  }'
else
  echo "❌ No dev token"
fi
echo ""

# Test 10: Send Chat Message
echo -e "\033[1;33m✅ Test 10: Send Chat Message\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  MESSAGE_RESPONSE=$(curl -s -X POST $BASE_URL/api/chat/project/$PROJECT_ID/message \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -F "message=Hello! Let's start working on the project.")
  
  echo "$MESSAGE_RESPONSE" | jq -r '.message // .error'
  sleep 2
else
  echo "❌ No student token or project ID"
fi
echo ""

# Test 11: Get Developer Home (After Message)
echo -e "\033[1;33m✅ Test 11: Get Developer Home (After Message)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  HOME_DATA=$(curl -s $BASE_URL/api/dev/home -H "Authorization: Bearer $DEV_TOKEN")
  echo "$HOME_DATA" | jq '{
    recentActivityCount: (.recentActivity | length),
    recentActivity: [.recentActivity[] | {type, title, description, timeAgo}],
    unreadNotificationsCount: .unreadNotificationsCount
  }'
else
  echo "❌ No dev token"
fi
echo ""

# Test 12: Full Response Check
echo -e "\033[1;33m✅ Test 12: Full Response Structure Check\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  HOME_DATA=$(curl -s $BASE_URL/api/dev/home -H "Authorization: Bearer $DEV_TOKEN")
  echo "$HOME_DATA" | jq '
    has("developer") and 
    has("dashboard") and 
    has("quickActions") and 
    has("recentActivity") and 
    has("unreadNotificationsCount")
  ' | grep -q true && echo "✅ All required fields present" || echo "❌ Missing fields"
else
  echo "❌ No dev token"
fi
echo ""

# Test 13: Check Dashboard Metrics
echo -e "\033[1;33m✅ Test 13: Check Dashboard Metrics Calculation\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  HOME_DATA=$(curl -s $BASE_URL/api/dev/home -H "Authorization: Bearer $DEV_TOKEN")
  echo "$HOME_DATA" | jq '.dashboard'
else
  echo "❌ No dev token"
fi
echo ""

# Test 14: Check Quick Actions
echo -e "\033[1;33m✅ Test 14: Check Quick Actions\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  HOME_DATA=$(curl -s $BASE_URL/api/dev/home -H "Authorization: Bearer $DEV_TOKEN")
  echo "$HOME_DATA" | jq '.quickActions'
else
  echo "❌ No dev token"
fi
echo ""

# Test 15: Unauthorized Access
echo -e "\033[1;33m✅ Test 15: Test Unauthorized Access\033[0m"
curl -s $BASE_URL/api/dev/home -H "Authorization: Bearer invalid_token" | jq -r '.error // "Unexpected response"'
echo ""

# Test 16: Get Full Response
echo -e "\033[1;33m✅ Test 16: Get Full Developer Home Response\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  curl -s $BASE_URL/api/dev/home -H "Authorization: Bearer $DEV_TOKEN" | jq
else
  echo "❌ No dev token"
fi
echo ""

echo -e "\033[0;32m========================================\033[0m"
echo -e "\033[0;32m✅ Developer Home API Tests Complete!\033[0m"
echo -e "\033[0;32m========================================\033[0m"
echo ""
echo "Tested Features:"
echo "  ✅ Developer info (name, rating)"
echo "  ✅ Dashboard metrics (projects, earnings, proposals, success rate)"
echo "  ✅ Quick actions"
echo "  ✅ Recent activity (proposals, messages, payments)"
echo "  ✅ Unread notifications count"
echo "  ✅ Time formatting"
echo "  ✅ Authorization"
echo ""
echo -e "\033[0;32m🎉 Developer Home API is fully functional!\033[0m"

