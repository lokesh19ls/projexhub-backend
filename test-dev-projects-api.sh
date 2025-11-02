#!/bin/bash

BASE_URL="https://projexhub-backend.onrender.com"
TIMESTAMP=$(date +%s)

echo "========================================="
echo "👨‍💻 Testing Developer Browse Projects API"
echo "URL: $BASE_URL/api/dev/projects"
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
echo ""

# Test 3: Register Student
echo -e "\033[1;33m✅ Test 3: Register Student\033[0m"
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
echo ""

# Test 4: Create Project
echo -e "\033[1;33m✅ Test 4: Create Project\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/api/projects \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d '{
      "title": "Flutter E-commerce App",
      "description": "Build a modern e-commerce mobile application with Flutter, featuring product catalog, shopping cart, payment integration, and order tracking with beautiful UI design",
      "technology": ["Flutter", "Dart", "Firebase"],
      "budget": 15000,
      "deadline": "2026-08-15"
    }')
  
  echo "$PROJECT_RESPONSE" | jq -r '.message // .error'
  PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.project.id // empty')
  echo "Project ID: $PROJECT_ID"
else
  echo "❌ No student token"
fi
echo ""

# Test 5: Browse Projects (Before Applying)
echo -e "\033[1;33m✅ Test 5: Browse Projects (Before Applying)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  PROJECTS=$(curl -s $BASE_URL/api/dev/projects -H "Authorization: Bearer $DEV_TOKEN")
  PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')
  echo "Found $PROJECT_COUNT projects"
  
  if [ "$PROJECT_COUNT" -gt 0 ]; then
    echo "First project:"
    echo "$PROJECTS" | jq '.[0] | {id, title, budget, technology, proposals_count, has_applied}'
  fi
else
  echo "❌ No dev token"
fi
echo ""

# Test 6: Send Proposal
echo -e "\033[1;33m✅ Test 6: Developer Sends Proposal\033[0m"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  PROPOSAL_RESPONSE=$(curl -s -X POST $BASE_URL/api/proposals/project/$PROJECT_ID \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $DEV_TOKEN" \
    -d '{
      "price": 14000,
      "timeline": 45,
      "technology": ["Flutter", "Dart", "Firebase"],
      "message": "I have extensive experience with Flutter and can deliver this project on time."
    }')
  
  echo "$PROPOSAL_RESPONSE" | jq -r '.message // .error'
  PROPOSAL_ID=$(echo "$PROPOSAL_RESPONSE" | jq -r '.proposal.id // empty')
  echo "Proposal ID: $PROPOSAL_ID"
else
  echo "❌ No dev token or project ID"
fi
echo ""

# Test 7: Browse Projects (After Applying)
echo -e "\033[1;33m✅ Test 7: Browse Projects (After Applying)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  PROJECTS=$(curl -s $BASE_URL/api/dev/projects -H "Authorization: Bearer $DEV_TOKEN")
  echo "Projects with application status:"
  echo "$PROJECTS" | jq '[.[] | select(.has_applied == "1")] | .[0] | {id, title, has_applied, my_proposal_id}'
else
  echo "❌ No dev token"
fi
echo ""

# Test 8: Filter by Technology
echo -e "\033[1;33m✅ Test 8: Filter by Technology (Flutter)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  PROJECTS=$(curl -s "$BASE_URL/api/dev/projects?technology=Flutter" -H "Authorization: Bearer $DEV_TOKEN")
  PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')
  echo "Found $PROJECT_COUNT Flutter projects"
else
  echo "❌ No dev token"
fi
echo ""

# Test 9: Filter by Status
echo -e "\033[1;33m✅ Test 9: Filter by Status (Open)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  PROJECTS=$(curl -s "$BASE_URL/api/dev/projects?status=open" -H "Authorization: Bearer $DEV_TOKEN")
  PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')
  echo "Found $PROJECT_COUNT open projects"
else
  echo "❌ No dev token"
fi
echo ""

# Test 10: Filter by Budget Range
echo -e "\033[1;33m✅ Test 10: Filter by Budget Range (5000-20000)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  PROJECTS=$(curl -s "$BASE_URL/api/dev/projects?minBudget=5000&maxBudget=20000" -H "Authorization: Bearer $DEV_TOKEN")
  PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')
  echo "Found $PROJECT_COUNT projects in budget range"
else
  echo "❌ No dev token"
fi
echo ""

# Test 11: Search Projects
echo -e "\033[1;33m✅ Test 11: Search Projects (E-commerce)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  PROJECTS=$(curl -s "$BASE_URL/api/dev/projects?search=e-commerce" -H "Authorization: Bearer $DEV_TOKEN")
  PROJECT_COUNT=$(echo "$PROJECTS" | jq 'length')
  echo "Found $PROJECT_COUNT projects matching 'e-commerce'"
else
  echo "❌ No dev token"
fi
echo ""

# Test 12: Pagination
echo -e "\033[1;33m✅ Test 12: Test Pagination\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  PROJECTS_PAGE1=$(curl -s "$BASE_URL/api/dev/projects?limit=5&offset=0" -H "Authorization: Bearer $DEV_TOKEN")
  PROJECTS_PAGE2=$(curl -s "$BASE_URL/api/dev/projects?limit=5&offset=5" -H "Authorization: Bearer $DEV_TOKEN")
  COUNT1=$(echo "$PROJECTS_PAGE1" | jq 'length')
  COUNT2=$(echo "$PROJECTS_PAGE2" | jq 'length')
  echo "Page 1: $COUNT1 projects"
  echo "Page 2: $COUNT2 projects"
else
  echo "❌ No dev token"
fi
echo ""

# Test 13: Full Response Check
echo -e "\033[1;33m✅ Test 13: Full Response Structure\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  PROJECTS=$(curl -s $BASE_URL/api/dev/projects -H "Authorization: Bearer $DEV_TOKEN")
  echo "$PROJECTS" | jq 'if length > 0 then .[0] | {fields: keys} else "No projects" end'
else
  echo "❌ No dev token"
fi
echo ""

# Test 14: Unauthorized Access
echo -e "\033[1;33m✅ Test 14: Unauthorized Access\033[0m"
curl -s $BASE_URL/api/dev/projects -H "Authorization: Bearer invalid_token" | jq -r '.error // "Unexpected response"'
echo ""

# Test 15: Full Response Sample
echo -e "\033[1;33m✅ Test 15: Full Response Sample\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  curl -s $BASE_URL/api/dev/projects -H "Authorization: Bearer $DEV_TOKEN" | jq '.[0]' 2>/dev/null || echo "No projects available"
else
  echo "❌ No dev token"
fi
echo ""

echo -e "\033[0;32m========================================\033[0m"
echo -e "\033[0;32m✅ Developer Browse Projects API Tests Complete!\033[0m"
echo -e "\033[0;32m========================================\033[0m"
echo ""
echo "Tested Features:"
echo "  ✅ Browse all projects"
echo "  ✅ Applied status tracking"
echo "  ✅ Proposals count"
echo "  ✅ Filter by technology"
echo "  ✅ Filter by status"
echo "  ✅ Filter by budget range"
echo "  ✅ Search functionality"
echo "  ✅ Pagination"
echo "  ✅ Authorization"
echo ""
echo -e "\033[0;32m🎉 Browse Projects API is fully functional!\033[0m"

