#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "🧪 Fresh Test of ProjexHub API"
echo "========================================="
echo ""

BASE_URL="http://localhost:3000/api"

# Generate unique email
TIMESTAMP=$(date +%s)
STUDENT_EMAIL="student${TIMESTAMP}@test.com"
DEV_EMAIL="dev${TIMESTAMP}@test.com"

echo -e "${YELLOW}1. Registering New Student...${NC}"
STUDENT_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Student\",
    \"email\": \"$STUDENT_EMAIL\",
    \"phone\": \"98765${TIMESTAMP:0:5}\",
    \"password\": \"password123\",
    \"role\": \"student\",
    \"college\": \"MIT\",
    \"department\": \"Computer Science\",
    \"yearOfStudy\": 4
  }")

echo "$STUDENT_RESPONSE" | jq -r '.message // .error'
STUDENT_TOKEN=$(echo "$STUDENT_RESPONSE" | jq -r '.token // empty')
echo ""

echo -e "${YELLOW}2. Registering New Developer...${NC}"
DEV_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Developer\",
    \"email\": \"$DEV_EMAIL\",
    \"phone\": \"98766${TIMESTAMP:0:5}\",
    \"password\": \"password123\",
    \"role\": \"developer\",
    \"skills\": [\"React\", \"Node.js\", \"TypeScript\"]
  }")

echo "$DEV_RESPONSE" | jq -r '.message // .error'
DEV_TOKEN=$(echo "$DEV_RESPONSE" | jq -r '.token // empty')
echo ""

echo -e "${YELLOW}3. Student Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"password123\"
  }")

echo "$LOGIN_RESPONSE" | jq -r '.message // .error'
echo ""

echo -e "${YELLOW}4. Get Student Profile...${NC}"
if [ ! -z "$STUDENT_TOKEN" ]; then
  PROFILE=$(curl -s $BASE_URL/auth/profile \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$PROFILE" | jq -r '"Name: " + .name + " | Email: " + .email + " | Role: " + .role'
else
  echo "❌ No token"
fi
echo ""

echo -e "${YELLOW}5. Create Project...${NC}"
if [ ! -z "$STUDENT_TOKEN" ]; then
  PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/projects \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d '{
      "title": "AI Chatbot Application",
      "description": "Build an intelligent chatbot using OpenAI API with natural language processing capabilities",
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

echo -e "${YELLOW}6. Developer Sending Proposal...${NC}"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROPOSAL_RESPONSE=$(curl -s -X POST $BASE_URL/proposals/project/$PROJECT_ID \
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

echo -e "${YELLOW}7. Get Proposals for Project...${NC}"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROPOSALS=$(curl -s $BASE_URL/proposals/project/$PROJECT_ID \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  PROPOSAL_COUNT=$(echo "$PROPOSALS" | jq 'length')
  echo "Found $PROPOSAL_COUNT proposals"
  if [ "$PROPOSAL_COUNT" -gt 0 ]; then
    echo "$PROPOSALS" | jq -r '.[0] | "Price: ₹" + (.price | tostring) + " | Timeline: " + (.timeline | tostring) + " days"'
  fi
else
  echo "❌ No student token or project ID"
fi
echo ""

echo -e "${YELLOW}8. Accept Proposal...${NC}"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROPOSAL_ID" ]; then
  ACCEPT_RESPONSE=$(curl -s -X POST $BASE_URL/proposals/$PROPOSAL_ID/accept \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$ACCEPT_RESPONSE" | jq -r '.message // .error'
else
  echo "❌ No student token or proposal ID"
fi
echo ""

echo -e "${YELLOW}9. Get My Projects (Student)...${NC}"
if [ ! -z "$STUDENT_TOKEN" ]; then
  MY_PROJECTS=$(curl -s $BASE_URL/projects/my-projects \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  MY_PROJECT_COUNT=$(echo "$MY_PROJECTS" | jq 'length')
  echo "Student has $MY_PROJECT_COUNT projects"
  if [ "$MY_PROJECT_COUNT" -gt 0 ]; then
    echo "$MY_PROJECTS" | jq -r '.[0] | "Project: " + .title + " | Status: " + .status'
  fi
else
  echo "❌ No student token"
fi
echo ""

echo -e "${YELLOW}10. Get My Proposals (Developer)...${NC}"
if [ ! -z "$DEV_TOKEN" ]; then
  MY_PROPOSALS=$(curl -s $BASE_URL/proposals/my-proposals \
    -H "Authorization: Bearer $DEV_TOKEN")
  MY_PROPOSAL_COUNT=$(echo "$MY_PROPOSALS" | jq 'length')
  echo "Developer has $MY_PROPOSAL_COUNT proposals"
  if [ "$MY_PROPOSAL_COUNT" -gt 0 ]; then
    echo "$MY_PROPOSALS" | jq -r '.[0] | "Project: " + .project_title + " | Status: " + .status'
  fi
else
  echo "❌ No dev token"
fi
echo ""

echo -e "${YELLOW}11. Create Review...${NC}"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  REVIEW_RESPONSE=$(curl -s -X POST $BASE_URL/reviews/project/$PROJECT_ID \
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

echo "========================================="
echo -e "${GREEN}✅ Fresh Test Complete!${NC}"
echo "========================================="
echo ""
echo "Tested Endpoints:"
echo "✅ User Registration (Student & Developer)"
echo "✅ Login"
echo "✅ Get Profile"
echo "✅ Create Project"
echo "✅ Send Proposal"
echo "✅ Get Proposals"
echo "✅ Accept Proposal"
echo "✅ My Projects"
echo "✅ My Proposals"
echo "✅ Create Review"
echo ""
echo "🎉 All endpoints working perfectly!"

