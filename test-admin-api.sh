#!/bin/bash

BASE_URL="https://projexhub-backend.onrender.com"
TIMESTAMP=$(date +%s)

echo "========================================="
echo "🔐 Testing Admin API - All Endpoints"
echo "Base URL: $BASE_URL/api/admin"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    
    if [ "$method" = "GET" ]; then
        if [ -z "$data" ]; then
            RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/admin$endpoint" \
                -H "Authorization: Bearer $ADMIN_TOKEN" \
                -H "Content-Type: application/json")
        else
            RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/admin$endpoint?$data" \
                -H "Authorization: Bearer $ADMIN_TOKEN" \
                -H "Content-Type: application/json")
        fi
    elif [ "$method" = "POST" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin$endpoint" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ "$method" = "PUT" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/admin$endpoint" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $HTTP_CODE)"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $HTTP_CODE)"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        ((FAILED++))
    fi
    echo ""
}

# Test 1: Admin Login
echo "========================================="
echo "1. Authentication"
echo "========================================="
echo ""

echo -e "${YELLOW}Testing: Admin Login${NC}"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/login" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "admin@workzo.com",
        "password": "password123"
    }')

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Login PASS${NC} (Status: $HTTP_CODE)"
    ADMIN_TOKEN=$(echo "$BODY" | jq -r '.token // empty')
    ADMIN_ID=$(echo "$BODY" | jq -r '.user.id // empty')
    echo "Admin ID: $ADMIN_ID"
    echo "Token: ${ADMIN_TOKEN:0:50}..."
    ((PASSED++))
else
    echo -e "${RED}❌ Login FAIL${NC} (Status: $HTTP_CODE)"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo -e "${RED}Cannot continue without admin token. Please create an admin user first.${NC}"
    exit 1
fi
echo ""

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${RED}❌ No admin token received. Cannot continue.${NC}"
    echo "Please ensure an admin user exists with email: admin@workzo.com"
    exit 1
fi

# Test 2: Dashboard Stats
echo "========================================="
echo "2. Dashboard"
echo "========================================="
echo ""

test_endpoint "Get Dashboard Statistics" "GET" "/dashboard/stats" "" "200"

# Test 3: User Management
echo "========================================="
echo "3. User Management"
echo "========================================="
echo ""

test_endpoint "List All Users" "GET" "/users" "" "200"
test_endpoint "List Users (Filtered by role=developer)" "GET" "/users" "role=developer&page=1&limit=5" "200"
test_endpoint "List Users (Filtered by isVerified=true)" "GET" "/users" "isVerified=true&page=1&limit=5" "200"
test_endpoint "List Users (Search)" "GET" "/users" "search=test&page=1&limit=5" "200"
test_endpoint "List Users (Pagination)" "GET" "/users" "page=1&limit=10" "200"

# Get first user ID for detail tests
USERS_RESPONSE=$(curl -s "$BASE_URL/api/admin/users?limit=1" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")
FIRST_USER_ID=$(echo "$USERS_RESPONSE" | jq -r '.data[0].id // empty')

if [ ! -z "$FIRST_USER_ID" ]; then
    test_endpoint "Get User Details" "GET" "/users/$FIRST_USER_ID" "" "200"
    # Note: We'll skip verify/deactivate to avoid modifying real users
    echo -e "${YELLOW}⚠️  Skipping verify/deactivate tests to avoid modifying users${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  No users found for detail tests${NC}"
    echo ""
fi

# Test 4: Project Management
echo "========================================="
echo "4. Project Management"
echo "========================================="
echo ""

test_endpoint "List All Projects" "GET" "/projects" "" "200"
test_endpoint "List Projects (Filtered by status=open)" "GET" "/projects" "status=open&page=1&limit=5" "200"
test_endpoint "List Projects (Search)" "GET" "/projects" "search=test&page=1&limit=5" "200"
test_endpoint "List Projects (Pagination)" "GET" "/projects" "page=1&limit=10" "200"

# Get first project ID for detail tests
PROJECTS_RESPONSE=$(curl -s "$BASE_URL/api/admin/projects?limit=1" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")
FIRST_PROJECT_ID=$(echo "$PROJECTS_RESPONSE" | jq -r '.data[0].id // empty')

if [ ! -z "$FIRST_PROJECT_ID" ]; then
    test_endpoint "Get Project Details" "GET" "/projects/$FIRST_PROJECT_ID" "" "200"
    # Test update status (change to in_progress, then back to original)
    ORIGINAL_STATUS=$(echo "$PROJECTS_RESPONSE" | jq -r '.data[0].status // empty')
    if [ ! -z "$ORIGINAL_STATUS" ]; then
        test_endpoint "Update Project Status" "PUT" "/projects/$FIRST_PROJECT_ID" "{\"status\":\"in_progress\"}" "200"
        # Restore original status
        curl -s -X PUT "$BASE_URL/api/admin/projects/$FIRST_PROJECT_ID" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{\"status\":\"$ORIGINAL_STATUS\"}" > /dev/null
    fi
else
    echo -e "${YELLOW}⚠️  No projects found for detail tests${NC}"
    echo ""
fi

# Test 5: Payment Management
echo "========================================="
echo "5. Payment Management"
echo "========================================="
echo ""

test_endpoint "List All Payments" "GET" "/payments" "" "200"
test_endpoint "List Payments (Filtered by status=completed)" "GET" "/payments" "status=completed&page=1&limit=5" "200"
test_endpoint "List Payments (Filtered by paymentType=full)" "GET" "/payments" "paymentType=full&page=1&limit=5" "200"
test_endpoint "List Payments (Pagination)" "GET" "/payments" "page=1&limit=10" "200"

# Get first payment ID for detail tests
PAYMENTS_RESPONSE=$(curl -s "$BASE_URL/api/admin/payments?limit=1" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")
FIRST_PAYMENT_ID=$(echo "$PAYMENTS_RESPONSE" | jq -r '.data[0].id // empty')

if [ ! -z "$FIRST_PAYMENT_ID" ]; then
    test_endpoint "Get Payment Details" "GET" "/payments/$FIRST_PAYMENT_ID" "" "200"
    # Note: We'll skip refund test to avoid modifying real payments
    echo -e "${YELLOW}⚠️  Skipping refund test to avoid modifying payments${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  No payments found for detail tests${NC}"
    echo ""
fi

# Test 6: Dispute Management
echo "========================================="
echo "6. Dispute Management"
echo "========================================="
echo ""

test_endpoint "List All Disputes" "GET" "/disputes" "" "200"
test_endpoint "List Disputes (Filtered by status=pending)" "GET" "/disputes" "status=pending&page=1&limit=5" "200"
test_endpoint "List Disputes (Filtered by raisedBy=student)" "GET" "/disputes" "raisedBy=student&page=1&limit=5" "200"
test_endpoint "List Disputes (Pagination)" "GET" "/disputes" "page=1&limit=10" "200"

# Get first dispute ID for detail tests
DISPUTES_RESPONSE=$(curl -s "$BASE_URL/api/admin/disputes?limit=1" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")
FIRST_DISPUTE_ID=$(echo "$DISPUTES_RESPONSE" | jq -r '.data[0].id // empty')

if [ ! -z "$FIRST_DISPUTE_ID" ]; then
    test_endpoint "Get Dispute Details" "GET" "/disputes/$FIRST_DISPUTE_ID" "" "200"
    # Note: We'll skip resolve test to avoid modifying real disputes
    echo -e "${YELLOW}⚠️  Skipping resolve test to avoid modifying disputes${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  No disputes found for detail tests${NC}"
    echo ""
fi

# Test 7: Error Cases
echo "========================================="
echo "7. Error Cases"
echo "========================================="
echo ""

test_endpoint "Get Non-existent User (404)" "GET" "/users/999999" "" "404"
test_endpoint "Get Non-existent Project (404)" "GET" "/projects/999999" "" "404"
test_endpoint "Get Non-existent Payment (404)" "GET" "/payments/999999" "" "404"
test_endpoint "Get Non-existent Dispute (404)" "GET" "/disputes/999999" "" "404"

# Test 8: Unauthorized Access
echo "========================================="
echo "8. Authorization Tests"
echo "========================================="
echo ""

echo -e "${YELLOW}Testing: Access without token${NC}"
UNAUTH_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/api/admin/dashboard/stats" \
    -H "Content-Type: application/json")
HTTP_CODE=$(echo "$UNAUTH_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Status: $HTTP_CODE - Unauthorized as expected)"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} (Expected: 401, Got: $HTTP_CODE)"
    ((FAILED++))
fi
echo ""

# Summary
echo "========================================="
echo "📊 Test Summary"
echo "========================================="
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo "Total Tests: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed${NC}"
    exit 1
fi

