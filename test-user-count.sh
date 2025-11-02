#!/bin/bash

echo "========================================="
echo "👥 Checking User Count in Database"
echo "========================================="
echo ""

# Create a test registration to verify user creation
TIMESTAMP=$(date +%s)
TEST_USER="testuser${TIMESTAMP}@test.com"

echo "Registering a test user..."
RESPONSE=$(curl -s -X POST https://projexhub-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test User\",
    \"email\": \"${TEST_USER}\",
    \"password\": \"password123\",
    \"role\": \"student\",
    \"college\": \"Test College\",
    \"department\": \"Computer Science\",
    \"yearOfStudy\": 4
  }")

echo "$RESPONSE" | jq -r '.message // .error'
echo ""

# Check if registration was successful
if echo "$RESPONSE" | jq -e '.user.id' > /dev/null 2>&1; then
  USER_ID=$(echo "$RESPONSE" | jq -r '.user.id')
  echo "✅ Test user created successfully"
  echo "User ID: $USER_ID"
  echo ""
  echo "This indicates the database is working and users can be created."
  echo "However, we cannot directly query the user count without admin access."
  echo ""
  echo "To check user count, you would need to:"
  echo "1. Create an admin user in the database"
  echo "2. Use the admin dashboard stats endpoint"
  echo "3. Or query the database directly"
else
  echo "Failed to create test user"
fi

echo ""
echo "Note: User count can be checked via:"
echo "  - Admin Dashboard API"
echo "  - Direct database query"
echo "  - Supabase Dashboard (if using Supabase)"

