#!/bin/bash

# اختبار Navigation APIs
# يستخدم curl لاختبار APIs

echo "🧪 بدء اختبار Navigation APIs..."
echo ""

# الألوان
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="${BASE_URL:-http://localhost:4000/api}"
TOKEN="${TOKEN:-}"

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local method=${3:-GET}
    
    echo -e "${YELLOW}Testing:${NC} $description"
    echo -e "  ${YELLOW}Endpoint:${NC} $method $BASE_URL$endpoint"
    
    if [ -z "$TOKEN" ]; then
        echo -e "  ${RED}⚠️  Warning: No token provided. Using cookie-based auth.${NC}"
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            --cookie-jar /tmp/test_cookies.txt \
            --cookie /tmp/test_cookies.txt)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        echo -e "  ${GREEN}✅ Success (HTTP $http_code)${NC}"
        echo "  Response:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body" | head -c 200
        echo ""
        return 0
    else
        echo -e "  ${RED}❌ Failed (HTTP $http_code)${NC}"
        echo "  Response:"
        echo "$body" | head -c 200
        echo ""
        return 1
    fi
}

# Test 1: Navigation Items
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "/navigation/items" "Get Navigation Items"

# Test 2: Navigation Stats
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "/navigation/stats" "Get Navigation Stats"

# Test 3: Quick Stats
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "/dashboard/quick-stats" "Get Quick Stats"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ اختبار APIs مكتمل!"
echo ""
echo "💡 Tips:"
echo "  - لتوفير token: export TOKEN='your-token'"
echo "  - لتغيير Base URL: export BASE_URL='http://your-url:port/api'"

