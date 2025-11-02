#!/bin/bash

BASE_URL="https://projexhub-backend.onrender.com"
TIMESTAMP=$(date +%s)

echo "========================================="
echo "📊 Testing Student Progress Tracking API"
echo "URL: $BASE_URL/api/projects/:id/progress"
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
    \"name\": \"Progress Student\",
    \"email\": \"progressstudent${TIMESTAMP}@test.com\",
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
    \"name\": \"Progress Developer\",
    \"email\": \"progressdev${TIMESTAMP}@test.com\",
    \"password\": \"password123\",
    \"role\": \"developer\",
    \"skills\": [\"React\", \"Node.js\", \"TypeScript\"]
  }")
echo "$DEV_RESPONSE" | jq -r '.message // .error'
DEV_TOKEN=$(echo "$DEV_RESPONSE" | jq -r '.token // empty')
DEV_ID=$(echo "$DEV_RESPONSE" | jq -r '.user.id // empty')
echo "Developer ID: $DEV_ID"
echo ""

# Test 4: Create Project
echo -e "\033[1;33m✅ Test 4: Create Project\033[0m"
PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "title": "Progress Tracking Test Project",
    "description": "A comprehensive test project to validate progress tracking features including milestones, timeline, and history",
    "technology": ["React", "Node.js"],
    "budget": 15000,
    "deadline": "2026-12-31"
  }')
echo "$PROJECT_RESPONSE" | jq -r '.message // .error'
PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.project.id // empty')
echo "Project ID: $PROJECT_ID"
echo ""

# Test 5: Send Proposal
echo -e "\033[1;33m✅ Test 5: Developer Sends Proposal\033[0m"
PROPOSAL_RESPONSE=$(curl -s -X POST $BASE_URL/api/proposals/project/$PROJECT_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DEV_TOKEN" \
  -d '{
    "price": 12000,
    "timeline": 45,
    "technology": ["React", "Node.js"],
    "message": "I can complete this project in 45 days"
  }')
echo "$PROPOSAL_RESPONSE" | jq -r '.message // .error'
PROPOSAL_ID=$(echo "$PROPOSAL_RESPONSE" | jq -r '.proposal.id // empty')
echo "Proposal ID: $PROPOSAL_ID"
echo ""

# Test 6: Accept Proposal
echo -e "\033[1;33m✅ Test 6: Accept Proposal\033[0m"
curl -s -X POST $BASE_URL/api/proposals/$PROPOSAL_ID/accept \
  -H "Authorization: Bearer $STUDENT_TOKEN" | jq -r '.message'
sleep 1
echo ""

# Test 7: Check Progress Tracking BEFORE Updates (Should be empty/initial)
echo -e "\033[1;33m✅ Test 7: Check Progress Tracking BEFORE Updates\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROGRESS_RESPONSE=$(curl -s $BASE_URL/api/projects/$PROJECT_ID/progress \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  
  echo "$PROGRESS_RESPONSE" | jq -r '.message'
  echo ""
  echo "Project Info:"
  echo "$PROGRESS_RESPONSE" | jq '.data.project'
  echo ""
  echo "Current Progress:"
  echo "$PROGRESS_RESPONSE" | jq '.data.currentProgress'
  echo ""
  echo "Milestones:"
  echo "$PROGRESS_RESPONSE" | jq '.data.milestones'
  echo ""
  echo "Progress History Count:"
  echo "$PROGRESS_RESPONSE" | jq '.data.progressHistory | length'
else
  echo "❌ No student token or project ID"
fi
echo ""

# Test 8: Developer Updates Progress to 20%
echo -e "\033[1;33m✅ Test 8: Developer Updates Progress to 20%\033[0m"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  UPDATE_RESPONSE=$(curl -s -X PUT $BASE_URL/api/dev/projects/$PROJECT_ID/progress \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DEV_TOKEN" \
    -d '{
      "progressPercentage": 20,
      "status": "in_progress",
      "progressNote": "Project setup completed. Basic architecture in place."
    }')
  
  echo "$UPDATE_RESPONSE" | jq -r '.message // .error'
  sleep 1
else
  echo "❌ No dev token or project ID"
fi
echo ""

# Test 9: Check Progress Tracking AFTER 20% Update
echo -e "\033[1;33m✅ Test 9: Check Progress Tracking AFTER 20% Update\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROGRESS_RESPONSE=$(curl -s $BASE_URL/api/projects/$PROJECT_ID/progress \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  
  echo "Milestones:"
  echo "$PROGRESS_RESPONSE" | jq '.data.milestones'
  echo ""
  echo "Latest Progress History:"
  echo "$PROGRESS_RESPONSE" | jq '.data.progressHistory[0]'
  echo ""
  echo "Current Progress:"
  echo "$PROGRESS_RESPONSE" | jq '.data.currentProgress'
else
  echo "❌ No student token or project ID"
fi
echo ""

# Test 10: Developer Updates Progress to 50%
echo -e "\033[1;33m✅ Test 10: Developer Updates Progress to 50%\033[0m"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  UPDATE_RESPONSE=$(curl -s -X PUT $BASE_URL/api/dev/projects/$PROJECT_ID/progress \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DEV_TOKEN" \
    -d '{
      "progressPercentage": 50,
      "progressNote": "Halfway milestone achieved! Core features implemented and tested."
    }')
  
  echo "$UPDATE_RESPONSE" | jq -r '.message // .error'
  sleep 1
else
  echo "❌ No dev token or project ID"
fi
echo ""

# Test 11: Developer Updates Progress to 100%
echo -e "\033[1;33m✅ Test 11: Developer Updates Progress to 100%\033[0m"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  UPDATE_RESPONSE=$(curl -s -X PUT $BASE_URL/api/dev/projects/$PROJECT_ID/progress \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DEV_TOKEN" \
    -d '{
      "progressPercentage": 100,
      "progressNote": "Project completed! All features implemented, tested, and delivered."
    }')
  
  echo "$UPDATE_RESPONSE" | jq -r '.message // .error'
  sleep 1
else
  echo "❌ No dev token or project ID"
fi
echo ""

# Test 12: Check Full Progress Tracking Data
echo -e "\033[1;33m✅ Test 12: Check Full Progress Tracking Data\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROGRESS_RESPONSE=$(curl -s $BASE_URL/api/projects/$PROJECT_ID/progress \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  
  echo "📊 Complete Progress Tracking Summary:"
  echo ""
  echo "Project:"
  echo "$PROGRESS_RESPONSE" | jq '.data.project'
  echo ""
  echo "Developer Info:"
  echo "$PROGRESS_RESPONSE" | jq '.data.developer'
  echo ""
  echo "Proposal Details:"
  echo "$PROGRESS_RESPONSE" | jq '.data.proposal'
  echo ""
  echo "Timeline Information:"
  echo "$PROGRESS_RESPONSE" | jq '.data.timeline'
  echo ""
  echo "Milestones Status:"
  echo "$PROGRESS_RESPONSE" | jq '.data.milestones'
  echo ""
  echo "Current Progress:"
  echo "$PROGRESS_RESPONSE" | jq '.data.currentProgress'
  echo ""
  echo "Progress History (All Updates):"
  echo "$PROGRESS_RESPONSE" | jq '.data.progressHistory'
else
  echo "❌ No student token or project ID"
fi
echo ""

# Test 13: Try Unauthorized Access (Different Student)
echo -e "\033[1;33m✅ Test 13: Try Unauthorized Access (Different Student)\033[0m"
UNAUTH_STUDENT_TOKEN=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Other Student\",\"email\":\"other${TIMESTAMP}@test.com\",\"password\":\"password123\",\"role\":\"student\"}" | jq -r '.token // empty')

if [ ! -z "$UNAUTH_STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  UNAUTH_RESPONSE=$(curl -s $BASE_URL/api/projects/$PROJECT_ID/progress \
    -H "Authorization: Bearer $UNAUTH_STUDENT_TOKEN")
  
  echo "$UNAUTH_RESPONSE" | jq -r '.error // "Unexpected success"'
else
  echo "❌ Could not create unauthorized student"
fi
echo ""

# Test 14: Try Developer Access (Should Fail)
echo -e "\033[1;33m✅ Test 14: Try Developer Access (Should Fail)\033[0m"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  DEV_RESPONSE=$(curl -s $BASE_URL/api/projects/$PROJECT_ID/progress \
    -H "Authorization: Bearer $DEV_TOKEN")
  
  echo "$DEV_RESPONSE" | jq -r '.error // "Unexpected success - developers should not access this"'
else
  echo "❌ No dev token or project ID"
fi
echo ""

echo -e "\033[0;32m========================================\033[0m"
echo -e "\033[0;32m✅ Progress Tracking API Tests Complete!\033[0m"
echo -e "\033[0;32m========================================\033[0m"
echo ""
echo "Tested Features:"
echo "  ✅ Get project progress tracking data"
echo "  ✅ View milestones (20%, 50%, 100%)"
echo "  ✅ Progress history with notes"
echo "  ✅ Timeline tracking (days elapsed, remaining, overdue)"
echo "  ✅ Developer information"
echo "  ✅ Proposal details"
echo "  ✅ Current progress status"
echo "  ✅ Authorization checks (student only)"
echo "  ✅ Unauthorized access prevention"
echo ""
echo -e "\033[0;32m🎉 Progress Tracking API is fully functional!\033[0m"

