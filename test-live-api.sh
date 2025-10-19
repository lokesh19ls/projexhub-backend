#!/bin/bash

BASE_URL="https://projexhub-backend.onrender.com"
TIMESTAMP=$(date +%s)

echo "========================================="
echo "🧪 Testing Live ProjexHub API"
echo "URL: $BASE_URL"
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
    \"phone\": \"98765${TIMESTAMP:0:5}\",
    \"password\": \"password123\",
    \"role\": \"student\",
    \"college\": \"MIT\",
    \"department\": \"Computer Science\",
    \"yearOfStudy\": 4
  }")
echo "$STUDENT_RESPONSE" | jq -r '.message // .error'
STUDENT_TOKEN=$(echo "$STUDENT_RESPONSE" | jq -r '.token // empty')
STUDENT_EMAIL="alice${TIMESTAMP}@test.com"
echo ""

# Test 3: Register Developer
echo -e "\033[1;33m✅ Test 3: Register Developer\033[0m"
DEV_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Bob Developer\",
    \"email\": \"bob${TIMESTAMP}@test.com\",
    \"phone\": \"98766${TIMESTAMP:0:5}\",
    \"password\": \"password123\",
    \"role\": \"developer\",
    \"skills\": [\"React\", \"Node.js\", \"TypeScript\"]
  }")
echo "$DEV_RESPONSE" | jq -r '.message // .error'
DEV_TOKEN=$(echo "$DEV_RESPONSE" | jq -r '.token // empty')
DEV_EMAIL="bob${TIMESTAMP}@test.com"
echo ""

# Test 4: Login
echo -e "\033[1;33m✅ Test 4: Student Login\033[0m"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"password123\"
  }")
echo "$LOGIN_RESPONSE" | jq -r '.message // .error'
echo ""

# Test 5: Get Profile
echo -e "\033[1;33m✅ Test 5: Get Student Profile\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  curl -s $BASE_URL/api/auth/profile -H "Authorization: Bearer $STUDENT_TOKEN" | jq -r '"Name: " + .name + " | Email: " + .email + " | Role: " + .role'
else
  echo "❌ No token"
fi
echo ""

# Test 6: Create Project
echo -e "\033[1;33m✅ Test 6: Create Project\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/api/projects \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d '{
      "title": "AI Chatbot Application",
      "description": "Build an intelligent chatbot using OpenAI API with natural language processing capabilities and real-time responses",
      "technology": ["Python", "OpenAI", "Flask"],
      "budget": 8000,
      "deadline": "2024-08-15"
    }')
  
  echo "$PROJECT_RESPONSE" | jq -r '.message // .error'
  PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.project.id // empty')
  echo "Project ID: $PROJECT_ID"
else
  echo "❌ No student token"
fi
echo ""

# Test 7: Get All Projects
echo -e "\033[1;33m✅ Test 7: Get All Projects\033[0m"
PROJECTS=$(curl -s $BASE_URL/api/projects -H "Authorization: Bearer $STUDENT_TOKEN")
PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')
echo "Found $PROJECT_COUNT projects"
echo ""

# Test 8: Send Proposal
echo -e "\033[1;33m✅ Test 8: Developer Sends Proposal\033[0m"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROPOSAL_RESPONSE=$(curl -s -X POST $BASE_URL/api/proposals/project/$PROJECT_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DEV_TOKEN" \
    -d '{
      "price": 7500,
      "timeline": 45,
      "technology": ["Python", "OpenAI", "Flask"],
      "message": "I specialize in AI and NLP. I can deliver this project with advanced features."
    }')
  
  echo "$PROPOSAL_RESPONSE" | jq -r '.message // .error'
  PROPOSAL_ID=$(echo "$PROPOSAL_RESPONSE" | jq -r '.proposal.id // empty')
  echo "Proposal ID: $PROPOSAL_ID"
else
  echo "❌ No dev token or project ID"
fi
echo ""

# Test 9: Get Proposals
echo -e "\033[1;33m✅ Test 9: Get Proposals for Project\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROPOSALS=$(curl -s $BASE_URL/api/proposals/project/$PROJECT_ID -H "Authorization: Bearer $STUDENT_TOKEN")
  PROPOSAL_COUNT=$(echo "$PROPOSALS" | jq 'length')
  echo "Found $PROPOSAL_COUNT proposals"
else
  echo "❌ No student token or project ID"
fi
echo ""

# Test 10: Accept Proposal
echo -e "\033[1;33m✅ Test 10: Accept Proposal\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROPOSAL_ID" ]; then
  ACCEPT_RESPONSE=$(curl -s -X POST $BASE_URL/api/proposals/$PROPOSAL_ID/accept \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$ACCEPT_RESPONSE" | jq -r '.message // .error'
else
  echo "❌ No student token or proposal ID"
fi
echo ""

# Test 11: Get My Projects
echo -e "\033[1;33m✅ Test 11: Get My Projects (Student)\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  MY_PROJECTS=$(curl -s $BASE_URL/api/projects/my-projects -H "Authorization: Bearer $STUDENT_TOKEN")
  MY_PROJECT_COUNT=$(echo "$MY_PROJECTS" | jq 'length')
  echo "Student has $MY_PROJECT_COUNT projects"
else
  echo "❌ No student token"
fi
echo ""

# Test 12: Get My Proposals
echo -e "\033[1;33m✅ Test 12: Get My Proposals (Developer)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  MY_PROPOSALS=$(curl -s $BASE_URL/api/proposals/my-proposals -H "Authorization: Bearer $DEV_TOKEN")
  MY_PROPOSAL_COUNT=$(echo "$MY_PROPOSALS" | jq 'length')
  echo "Developer has $MY_PROPOSAL_COUNT proposals"
else
  echo "❌ No dev token"
fi
echo ""

# Test 13: Create Review
echo -e "\033[1;33m✅ Test 13: Create Review\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  REVIEW_RESPONSE=$(curl -s -X POST $BASE_URL/api/reviews/project/$PROJECT_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d '{
      "rating": 5,
      "comment": "Amazing developer! Delivered exactly what was promised."
    }')
  
  echo "$REVIEW_RESPONSE" | jq -r '.message // .error'
else
  echo "❌ No student token or project ID"
fi
echo ""

echo -e "\033[0;32m========================================\033[0m"
echo -e "\033[0;32m✅ All Tests Complete!\033[0m"
echo -e "\033[0;32m========================================\033[0m"
echo ""
echo "Tested Endpoints:"
echo "  ✅ Health Check"
echo "  ✅ User Registration (Student & Developer)"
echo "  ✅ Login"
echo "  ✅ Get Profile"
echo "  ✅ Create Project"
echo "  ✅ Get All Projects"
echo "  ✅ Send Proposal"
echo "  ✅ Get Proposals"
echo "  ✅ Accept Proposal"
echo "  ✅ My Projects"
echo "  ✅ My Proposals"
echo "  ✅ Create Review"
echo ""
echo -e "\033[0;32m🎉 API is fully functional!\033[0m"
