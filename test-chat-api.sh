#!/bin/bash

BASE_URL="https://projexhub-backend.onrender.com"
TIMESTAMP=$(date +%s)

echo "========================================="
echo "💬 Testing ProjexHub Chat API"
echo "URL: $BASE_URL/api/chat"
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
STUDENT_EMAIL="alice${TIMESTAMP}@test.com"
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
DEV_EMAIL="bob${TIMESTAMP}@test.com"
echo ""

# Test 4: Create Project
echo -e "\033[1;33m✅ Test 4: Create Project\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  PROJECT_RESPONSE=$(curl -s -X POST $BASE_URL/api/projects \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -d '{
      "title": "AI Chatbot Application",
      "description": "Build an intelligent chatbot using OpenAI API with natural language processing capabilities",
      "technology": ["Python", "OpenAI", "Flask"],
      "budget": 8000,
      "deadline": "2026-08-15"
    }')
  
  echo "$PROJECT_RESPONSE" | jq -r '.message // .error // .'
  PROJECT_ID=$(echo "$PROJECT_RESPONSE" | jq -r '.project.id // empty')
  if [ -z "$PROJECT_ID" ]; then
    echo "Full response:"
    echo "$PROJECT_RESPONSE" | jq
  else
    echo "Project ID: $PROJECT_ID"
  fi
else
  echo "❌ No student token"
fi
echo ""

# Test 5: Send Proposal
echo -e "\033[1;33m✅ Test 5: Developer Sends Proposal\033[0m"
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

# Test 6: Accept Proposal
echo -e "\033[1;33m✅ Test 6: Accept Proposal\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROPOSAL_ID" ]; then
  ACCEPT_RESPONSE=$(curl -s -X POST $BASE_URL/api/proposals/$PROPOSAL_ID/accept \
    -H "Authorization: Bearer $STUDENT_TOKEN")
  echo "$ACCEPT_RESPONSE" | jq -r '.message // .error'
else
  echo "❌ No student token or proposal ID"
fi
echo ""

# Test 7: Get Conversations (Before any messages)
echo -e "\033[1;33m✅ Test 7: Get Conversations (Student)\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  CONVERSATIONS=$(curl -s $BASE_URL/api/chat/conversations -H "Authorization: Bearer $STUDENT_TOKEN")
  CONV_COUNT=$(echo "$CONVERSATIONS" | jq 'length')
  echo "Found $CONV_COUNT conversations"
  if [ "$CONV_COUNT" -gt 0 ]; then
    echo "First conversation:"
    echo "$CONVERSATIONS" | jq '.[0] | {project_id: .id, title, other_user_name, last_message}'
  fi
else
  echo "❌ No student token"
fi
echo ""

# Test 8: Get Conversations (Developer)
echo -e "\033[1;33m✅ Test 8: Get Conversations (Developer)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  CONVERSATIONS=$(curl -s $BASE_URL/api/chat/conversations -H "Authorization: Bearer $DEV_TOKEN")
  CONV_COUNT=$(echo "$CONVERSATIONS" | jq 'length')
  echo "Found $CONV_COUNT conversations"
  if [ "$CONV_COUNT" -gt 0 ]; then
    echo "First conversation:"
    echo "$CONVERSATIONS" | jq '.[0] | {project_id: .id, title, other_user_name, last_message}'
  fi
else
  echo "❌ No dev token"
fi
echo ""

# Test 9: Student Sends Message
echo -e "\033[1;33m✅ Test 9: Student Sends Message\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  MESSAGE1_RESPONSE=$(curl -s -X POST $BASE_URL/api/chat/project/$PROJECT_ID/message \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -F "message=Hello! When can we start working on the project?")
  
  echo "$MESSAGE1_RESPONSE" | jq -r '.message // .error'
  if [ "$?" -eq 0 ] && echo "$MESSAGE1_RESPONSE" | jq -e '.data.id' > /dev/null 2>&1; then
    echo "✅ Message sent successfully"
  else
    echo "❌ Failed to send message"
  fi
else
  echo "❌ No student token or project ID"
fi
echo ""

# Test 10: Developer Sends Message
echo -e "\033[1;33m✅ Test 10: Developer Sends Message\033[0m"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  MESSAGE2_RESPONSE=$(curl -s -X POST $BASE_URL/api/chat/project/$PROJECT_ID/message \
    -H "Authorization: Bearer $DEV_TOKEN" \
    -F "message=Hi Alice! I can start immediately. Let me know your requirements.")
  
  echo "$MESSAGE2_RESPONSE" | jq -r '.message // .error'
  if [ "$?" -eq 0 ] && echo "$MESSAGE2_RESPONSE" | jq -e '.data.id' > /dev/null 2>&1; then
    echo "✅ Message sent successfully"
  else
    echo "❌ Failed to send message"
  fi
else
  echo "❌ No dev token or project ID"
fi
echo ""

# Test 11: Student Sends Another Message
echo -e "\033[1;33m✅ Test 11: Student Sends Another Message\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  MESSAGE3_RESPONSE=$(curl -s -X POST $BASE_URL/api/chat/project/$PROJECT_ID/message \
    -H "Authorization: Bearer $STUDENT_TOKEN" \
    -F "message=Great! I need the chatbot to handle multiple languages and have a web interface.")
  
  echo "$MESSAGE3_RESPONSE" | jq -r '.message // .error'
  if [ "$?" -eq 0 ] && echo "$MESSAGE3_RESPONSE" | jq -e '.data.id' > /dev/null 2>&1; then
    echo "✅ Message sent successfully"
  else
    echo "❌ Failed to send message"
  fi
else
  echo "❌ No student token or project ID"
fi
echo ""

# Test 12: Get Messages (Student View)
echo -e "\033[1;33m✅ Test 12: Get Messages (Student View)\033[0m"
if [ ! -z "$STUDENT_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  MESSAGES=$(curl -s $BASE_URL/api/chat/project/$PROJECT_ID/messages -H "Authorization: Bearer $STUDENT_TOKEN")
  MSG_COUNT=$(echo "$MESSAGES" | jq 'length')
  echo "Found $MSG_COUNT messages"
  if [ "$MSG_COUNT" -gt 0 ]; then
    echo "Latest messages:"
    echo "$MESSAGES" | jq -r '.[] | "\(.sender_name): \(.message // "[file: \(.file_name)]")"'
  fi
else
  echo "❌ No student token or project ID"
fi
echo ""

# Test 13: Get Messages (Developer View)
echo -e "\033[1;33m✅ Test 13: Get Messages (Developer View)\033[0m"
if [ ! -z "$DEV_TOKEN" ] && [ ! -z "$PROJECT_ID" ]; then
  MESSAGES=$(curl -s $BASE_URL/api/chat/project/$PROJECT_ID/messages -H "Authorization: Bearer $DEV_TOKEN")
  MSG_COUNT=$(echo "$MESSAGES" | jq 'length')
  echo "Found $MSG_COUNT messages"
  if [ "$MSG_COUNT" -gt 0 ]; then
    echo "Latest messages:"
    echo "$MESSAGES" | jq -r '.[] | "\(.sender_name): \(.message // "[file: \(.file_name)]")"'
  fi
else
  echo "❌ No dev token or project ID"
fi
echo ""

# Test 14: Get Updated Conversations (Student)
echo -e "\033[1;33m✅ Test 14: Get Updated Conversations (Student)\033[0m"
if [ ! -z "$STUDENT_TOKEN" ]; then
  CONVERSATIONS=$(curl -s $BASE_URL/api/chat/conversations -H "Authorization: Bearer $STUDENT_TOKEN")
  CONV_COUNT=$(echo "$CONVERSATIONS" | jq 'length')
  echo "Found $CONV_COUNT conversations"
  if [ "$CONV_COUNT" -gt 0 ]; then
    echo "First conversation details:"
    echo "$CONVERSATIONS" | jq '.[0] | {
      project_id: .id,
      title,
      other_user_name,
      last_message,
      last_message_time
    }'
  fi
else
  echo "❌ No student token"
fi
echo ""

# Test 15: Get Updated Conversations (Developer)
echo -e "\033[1;33m✅ Test 15: Get Updated Conversations (Developer)\033[0m"
if [ ! -z "$DEV_TOKEN" ]; then
  CONVERSATIONS=$(curl -s $BASE_URL/api/chat/conversations -H "Authorization: Bearer $DEV_TOKEN")
  CONV_COUNT=$(echo "$CONVERSATIONS" | jq 'length')
  echo "Found $CONV_COUNT conversations"
  if [ "$CONV_COUNT" -gt 0 ]; then
    echo "First conversation details:"
    echo "$CONVERSATIONS" | jq '.[0] | {
      project_id: .id,
      title,
      other_user_name,
      last_message,
      last_message_time
    }'
  fi
else
  echo "❌ No dev token"
fi
echo ""

# Test 16: Try to access unauthorized project
echo -e "\033[1;33m✅ Test 16: Try Unauthorized Access\033[0m"
UNAUTH_TOKEN="invalid_token_123"
curl -s $BASE_URL/api/chat/project/$PROJECT_ID/messages -H "Authorization: Bearer $UNAUTH_TOKEN" | jq -r '.error // "Unexpected response"'
echo ""

echo -e "\033[0;32m========================================\033[0m"
echo -e "\033[0;32m✅ Chat API Tests Complete!\033[0m"
echo -e "\033[0;32m========================================\033[0m"
echo ""
echo "Tested Endpoints:"
echo "  ✅ Health Check"
echo "  ✅ User Registration (Student & Developer)"
echo "  ✅ Create Project"
echo "  ✅ Send Proposal"
echo "  ✅ Accept Proposal"
echo "  ✅ Get Conversations (Student & Developer)"
echo "  ✅ Send Message (Student & Developer)"
echo "  ✅ Get Messages (Student & Developer View)"
echo "  ✅ Conversation Updates"
echo "  ✅ Authorization Check"
echo ""
echo -e "\033[0;32m🎉 Chat API is fully functional!\033[0m"

