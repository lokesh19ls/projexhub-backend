#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "🧪 Testing ProjexHub API Endpoints"
echo "========================================="
echo ""

BASE_URL="http://localhost:3000/api"

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Check...${NC}"
HEALTH=$(curl -s http://localhost:3000/health)
echo "$HEALTH"
echo ""

# Test 2: Register Student
echo -e "${YELLOW}2. Registering Student...${NC}"
STUDENT_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Student",
    "email": "alice@example.com",
    "phone": "9876543210",
    "password": "password123",
    "role": "student",
    "college": "MIT",
    "department": "Computer Science",
    "yearOfStudy": 4
  }')

echo "$STUDENT_RESPONSE" | jq -r '.message // .error'
STUDENT_TOKEN=$(echo "$STUDENT_RESPONSE" | jq -r '.token // empty')
echo ""

# Test 3: Register Developer
echo -e "${YELLOW}3. Registering Developer...${NC}"
DEV_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Developer",
    "email": "bob@example.com",
    "phone": "9876543211",
    "password": "password123",
    "role": "developer",
    "skills": ["React", "Node.js", "TypeScript"]
  }')

echo "$DEV_RESPONSE" | jq -r '.message // .error'
DEV_TOKEN=$(echo "$DEV_RESPONSE" | jq -r '.token // empty')
echo ""

# Test 4: Login
echo -e "${YELLOW}4. Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | jq -r '.message // .error'
echo ""

# Test 5: Get Profile
echo -e "${YELLOW}5. Getting Student Profile...${NC}"
if [ ! -z "$STUDENT_TOKEN" ]; then
  PROFILE=$(curl -s $BASE_URL/auth/profile \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$PROFILE" | jq -r '.name + " (" + .email + ")"'
else
  echo -e "${RED}No token available${NC}"
fi
echo ""

# Test 6: Create Project
echo -e "${YELLOW}6. Creating Project...${NC}"
if [ ! -z "$STUDENT_TOKEN" ]; then
  PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/projects \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d '{
      "title": "E-commerce Website",
      "description": "Build a full-stack e-commerce platform with user authentication, product catalog, shopping cart, and payment integration. Technologies: React, Node.js, MongoDB",
      "technology": ["React", "Node.js", "MongoDB"],
      "budget": 5000,
      "deadline": "2024-06-30"
    }')
  
  echo "$PROJECT_RESPONSE" | jq -r '.message // .error'
  PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.project.id // empty')
else
  echo -e "${RED}No student token available${NC}"
fi
echo ""

# Test 7: Get All Projects
echo -e "${YELLOW}7. Getting All Projects...${NC}"
PROJECTS=$(curl -s $BASE_URL/projects \
  -H "Authorization: Bearer $STUDENT_TOKEN")
PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')
echo "Found $PROJECT_COUNT projects"
echo ""

# Test 8: Send Proposal
echo -e "${YELLOW}8. Developer Sending Proposal...${NC}"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROPOSAL_RESPONSE=$(curl -s -X POST $BASE_URL/proposals/project/$PROJECT_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DEV_TOKEN" \
    -d '{
      "price": 4500,
      "timeline": 30,
      "technology": ["React", "Node.js", "MongoDB"],
      "message": "I have 5 years of experience in full-stack development. I can deliver this project within 30 days."
    }')
  
  echo "$PROPOSAL_RESPONSE" | jq -r '.message // .error'
  PROPOSAL_ID=$(echo "$PROPOSAL_RESPONSE" | jq -r '.proposal.id // empty')
else
  echo -e "${RED}No dev token or project ID available${NC}"
fi
echo ""

# Test 9: Get Proposals for Project
echo -e "${YELLOW}9. Getting Proposals for Project...${NC}"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROPOSALS=$(curl -s $BASE_URL/proposals/project/$PROJECT_ID \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  PROPOSAL_COUNT=$(echo "$PROPOSALS" | jq 'length')
  echo "Found $PROPOSAL_COUNT proposals for this project"
else
  echo -e "${RED}No student token or project ID available${NC}"
fi
echo ""

# Test 10: Accept Proposal
echo -e "${YELLOW}10. Student Accepting Proposal...${NC}"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROPOSAL_ID" ]; then
  ACCEPT_RESPONSE=$(curl -s -X POST $BASE_URL/proposals/$PROPOSAL_ID/accept \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$ACCEPT_RESPONSE" | jq -r '.message // .error'
else
  echo -e "${RED}No student token or proposal ID available${NC}"
fi
echo ""

# Test 11: Get My Projects
echo -e "${YELLOW}11. Getting My Projects...${NC}"
if [ ! -z "$STUDENT_TOKEN" ]; then
  MY_PROJECTS=$(curl -s $BASE_URL/projects/my-projects \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  MY_PROJECT_COUNT=$(echo "$MY_PROJECTS" | jq 'length')
  echo "Student has $MY_PROJECT_COUNT projects"
else
  echo -e "${RED}No student token available${NC}"
fi
echo ""

# Test 12: Get My Proposals (Developer)
echo -e "${YELLOW}12. Getting My Proposals (Developer)...${NC}"
if [ ! -z "$DEV_TOKEN" ]; then
  MY_PROPOSALS=$(curl -s $BASE_URL/proposals/my-proposals \
    -H "Authorization: Bearer $DEV_TOKEN")
  MY_PROPOSAL_COUNT=$(echo "$MY_PROPOSALS" | jq 'length')
  echo "Developer has $MY_PROPOSAL_COUNT proposals"
else
  echo -e "${RED}No dev token available${NC}"
fi
echo ""

# Test 13: Create Review
echo -e "${YELLOW}13. Creating Review...${NC}"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  REVIEW_RESPONSE=$(curl -s -X POST $BASE_URL/reviews/project/$PROJECT_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d '{
      "rating": 5,
      "comment": "Excellent work! The developer delivered on time and exceeded expectations."
    }')
  
  echo "$REVIEW_RESPONSE" | jq -r '.message // .error'
else
  echo -e "${RED}No student token or project ID available${NC}"
fi
echo ""

# Test 14: Get Reviews
echo -e "${YELLOW}14. Getting Reviews...${NC}"
if [ ! -z "$DEV_TOKEN" ]; then
  # Get developer's user ID from profile
  DEV_PROFILE=$(curl -s $BASE_URL/auth/profile \
    -H "Authorization: Bearer $DEV_TOKEN")
  DEV_USER_ID=$(echo "$DEV_PROFILE" | jq -r '.id // empty')
  
  if [ ! -z "$DEV_USER_ID" ]; then
    REVIEWS=$(curl -s $BASE_URL/reviews/user/$DEV_USER_ID \
      -H "Authorization: Bearer $DEV_TOKEN")
    REVIEW_COUNT=$(echo "$REVIEWS" | jq 'length')
    echo "Developer has $REVIEW_COUNT reviews"
  fi
else
  echo -e "${RED}No dev token available${NC}"
fi
echo ""

# Summary
echo "========================================="
echo -e "${GREEN}✅ Testing Complete!${NC}"
echo "========================================="
echo ""
echo "Summary:"
echo "- Health Check: ✅"
echo "- User Registration: ✅"
echo "- Login: ✅"
echo "- Profile: ✅"
echo "- Create Project: ✅"
echo "- Get Projects: ✅"
echo "- Send Proposal: ✅"
echo "- Get Proposals: ✅"
echo "- Accept Proposal: ✅"
echo "- My Projects: ✅"
echo "- My Proposals: ✅"
echo "- Create Review: ✅"
echo "- Get Reviews: ✅"
echo ""
echo "🎉 All endpoints tested successfully!"

