#!/bin/bash

BASE_URL="http://localhost:3000"
TIMESTAMP=$(date +%s)

echo "========================================="
echo "📁 Testing Project Files API"
echo "URL base: $BASE_URL"
echo "========================================="
echo ""

# Health check
echo -e "\033[1;33m✅ Test 1: Health Check\033[0m"
curl -s "$BASE_URL/health" | jq
echo ""

# Register developer
echo -e "\033[1;33m✅ Test 2: Register Developer\033[0m"
DEV_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"File Dev\",
    \"email\": \"filedev${TIMESTAMP}@test.com\",
    \"password\": \"password123\",
    \"role\": \"developer\",
    \"skills\": [\"Node.js\", \"Express\"]
  }")
echo "$DEV_RESPONSE" | jq -r '.message // .error'
DEV_TOKEN=$(echo "$DEV_RESPONSE" | jq -r '.token // empty')
echo "Developer token present: $( [ -n "$DEV_TOKEN" ] && echo yes || echo no )"
echo ""

# Register student
echo -e "\033[1;33m✅ Test 3: Register Student\033[0m"
STUDENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"File Student\",
    \"email\": \"filestudent${TIMESTAMP}@test.com\",
    \"password\": \"password123\",
    \"role\": \"student\",
    \"college\": \"Test College\",
    \"department\": \"CSE\",
    \"yearOfStudy\": 3
  }")
echo "$STUDENT_RESPONSE" | jq -r '.message // .error'
STUDENT_TOKEN=$(echo "$STUDENT_RESPONSE" | jq -r '.token // empty')
echo "Student token present: $( [ -n "$STUDENT_TOKEN" ] && echo yes || echo no )"
echo ""

# Create project
echo -e "\033[1;33m✅ Test 4: Create Project\033[0m"
PROJECT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d "{
    \"title\": \"File Upload Test Project\",
    \"description\": \"Project used to test file upload, list and delete APIs for milestones.\",
    \"technology\": [\"Node.js\", \"PostgreSQL\"],
    \"budget\": 5000,
    \"deadline\": \"2026-08-15\"
  }")
echo "$PROJECT_RESPONSE" | jq -r '.message // .error'
PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.project.id // empty')
echo "Project ID: $PROJECT_ID"
echo ""

# Developer sends proposal
echo -e "\033[1;33m✅ Test 5: Developer Sends Proposal\033[0m"
PROPOSAL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/proposals/project/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DEV_TOKEN" \
  -d "{
    \"price\": 4000,
    \"timeline\": 30,
    \"technology\": [\"Node.js\"],
    \"message\": \"I will also manage all file uploads.\"
  }")
echo "$PROPOSAL_RESPONSE" | jq -r '.message // .error'
PROPOSAL_ID=$(echo "$PROPOSAL_RESPONSE" | jq -r '.proposal.id // empty')
echo "Proposal ID: $PROPOSAL_ID"
echo ""

# Student accepts proposal
echo -e "\033[1;33m✅ Test 6: Accept Proposal\033[0m"
ACCEPT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/proposals/$PROPOSAL_ID/accept" \
  -H "Authorization: Bearer $STUDENT_TOKEN")
echo "$ACCEPT_RESPONSE" | jq -r '.message // .error'
echo ""

# Create a temporary file to upload
TEST_FILE_PATH="/tmp/test_upload_${TIMESTAMP}.txt"
echo "This is a test project file at $TIMESTAMP" > "$TEST_FILE_PATH"

# Upload file (developer)
echo -e "\033[1;33m✅ Test 7: Upload File (Developer)\033[0m"
UPLOAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/projects/$PROJECT_ID/files" \
  -H "Authorization: Bearer $DEV_TOKEN" \
  -F "file=@$TEST_FILE_PATH" \
  -F "milestonePercentage=20" \
  -F "description=Initial source code and documentation.")
echo "$UPLOAD_RESPONSE" | jq -r '.message // .error'
echo "$UPLOAD_RESPONSE" | jq '.file | {id, projectId, fileName, milestonePercentage, fileUrl}'
FILE_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.file.id // empty')
echo "Uploaded File ID: $FILE_ID"
echo ""

# List files (student)
echo -e "\033[1;33m✅ Test 8: List Files (Student)\033[0m"
LIST_RESPONSE=$(curl -s "$BASE_URL/api/projects/$PROJECT_ID/files" \
  -H "Authorization: Bearer $STUDENT_TOKEN")
echo "$LIST_RESPONSE" | jq '.files | map({id, fileName, milestonePercentage, uploadedBy, fileUrl})'
echo ""

# Try unauthorized upload as student (should fail)
echo -e "\033[1;33m✅ Test 9: Unauthorized Upload (Student should fail)\033[0m"
UNAUTH_UPLOAD=$(curl -s -X POST "$BASE_URL/api/projects/$PROJECT_ID/files" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -F "file=@$TEST_FILE_PATH" \
  -F "milestonePercentage=50")
echo "$UNAUTH_UPLOAD" | jq -r '.error // .message // "Unexpected success"'
echo ""

# Delete file (developer)
echo -e "\033[1;33m✅ Test 10: Delete File (Developer)\033[0m"
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/projects/$PROJECT_ID/files/$FILE_ID" \
  -H "Authorization: Bearer $DEV_TOKEN")
echo "$DELETE_RESPONSE" | jq -r '.message // .error'
echo ""

# Confirm list is empty / updated
echo -e "\033[1;33m✅ Test 11: List Files After Delete\033[0m"
LIST_AFTER_DELETE=$(curl -s "$BASE_URL/api/projects/$PROJECT_ID/files" \
  -H "Authorization: Bearer $STUDENT_TOKEN")
echo "$LIST_AFTER_DELETE" | jq '.files | map({id, fileName})'
echo ""

echo -e "\033[0;32m========================================\033[0m"
echo -e "\033[0;32m✅ Project Files API Tests Complete!\033[0m"
echo -e "\033[0;32m========================================\033[0m"
echo ""


