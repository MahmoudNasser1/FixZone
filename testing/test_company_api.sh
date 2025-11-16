#!/bin/bash
# 🔧 سكريبت اختبار Company Management API
# Company Management API Test Script

BASE_URL="http://localhost:3001"
TEST_COMPANY_ID=""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🏢 اختبار Company Management API"
echo "================================"
echo ""

# الحصول على Token
echo "📝 خطوة 1: الحصول على Token..."
echo "الرجاء تسجيل الدخول في المتصفح أولاً (http://localhost:3000)"
echo "ثم افتح Browser Console واكتب:"
echo ""
echo "const authStorage = localStorage.getItem('auth-storage');"
echo "const token = JSON.parse(authStorage)?.state?.token;"
echo "console.log('Token:', token);"
echo ""
read -p "أدخل Token: " TOKEN

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Token مطلوب للاختبار${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token تم الحصول عليه${NC}"
echo ""

# Test 1: GET /api/companies/:id
echo "📋 Test 1: GET /api/companies/:id"
read -p "أدخل Company ID للاختبار: " TEST_COMPANY_ID
if [ -n "$TEST_COMPANY_ID" ]; then
    echo "GET ${BASE_URL}/api/companies/${TEST_COMPANY_ID}"
    curl -X GET "${BASE_URL}/api/companies/${TEST_COMPANY_ID}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -w "\nStatus: %{http_code}\n" \
        -s | jq '.' || cat
    echo ""
fi

# Test 2: POST /api/companies
echo "📋 Test 2: POST /api/companies (Create)"
read -p "هل تريد إنشاء شركة جديدة؟ (y/n): " CREATE_NEW
if [ "$CREATE_NEW" = "y" ]; then
    echo "POST ${BASE_URL}/api/companies"
    RESPONSE=$(curl -X POST "${BASE_URL}/api/companies" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "شركة اختبار '$(date +%s)'",
            "email": "test'$(date +%s)'@company.com",
            "phone": "01234567890",
            "address": "عنوان الشركة",
            "taxNumber": "TAX'$(date +%s)'",
            "status": "active"
        }' \
        -w "\n%{http_code}" \
        -s)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    echo "$BODY" | jq '.' || echo "$BODY"
    echo "Status: $HTTP_CODE"
    
    if [ "$HTTP_CODE" = "201" ]; then
        TEST_COMPANY_ID=$(echo "$BODY" | jq -r '.id' 2>/dev/null)
        if [ -n "$TEST_COMPANY_ID" ] && [ "$TEST_COMPANY_ID" != "null" ]; then
            echo -e "${GREEN}✅ تم إنشاء الشركة بنجاح - ID: ${TEST_COMPANY_ID}${NC}"
        fi
    fi
    echo ""
fi

# Test 3: PUT /api/companies/:id
if [ -n "$TEST_COMPANY_ID" ] && [ "$TEST_COMPANY_ID" != "null" ]; then
    echo "📋 Test 3: PUT /api/companies/:id (Update)"
    read -p "هل تريد تحديث الشركة ${TEST_COMPANY_ID}؟ (y/n): " UPDATE_COMPANY
    if [ "$UPDATE_COMPANY" = "y" ]; then
        echo "PUT ${BASE_URL}/api/companies/${TEST_COMPANY_ID}"
        curl -X PUT "${BASE_URL}/api/companies/${TEST_COMPANY_ID}" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            -d '{
                "name": "شركة اختبار محدثة '$(date +%s)'",
                "email": "updated'$(date +%s)'@company.com",
                "phone": "09876543210",
                "address": "عنوان محدث",
                "taxNumber": "TAX654321",
                "status": "active"
            }' \
            -w "\nStatus: %{http_code}\n" \
            -s | jq '.' || cat
        echo ""
    fi
fi

# Test 4: GET /api/companies/:id/customers
if [ -n "$TEST_COMPANY_ID" ] && [ "$TEST_COMPANY_ID" != "null" ]; then
    echo "📋 Test 4: GET /api/companies/:id/customers"
    read -p "هل تريد جلب عملاء الشركة ${TEST_COMPANY_ID}؟ (y/n): " GET_CUSTOMERS
    if [ "$GET_CUSTOMERS" = "y" ]; then
        echo "GET ${BASE_URL}/api/companies/${TEST_COMPANY_ID}/customers"
        curl -X GET "${BASE_URL}/api/companies/${TEST_COMPANY_ID}/customers" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            -w "\nStatus: %{http_code}\n" \
            -s | jq '.' || cat
        echo ""
    fi
fi

# Test 5: GET /api/companies (search)
echo "📋 Test 5: GET /api/companies (search)"
read -p "أدخل مصطلح البحث (أو اضغط Enter للتخطي): " SEARCH_TERM
if [ -n "$SEARCH_TERM" ]; then
    echo "GET ${BASE_URL}/api/companies?search=${SEARCH_TERM}"
    curl -X GET "${BASE_URL}/api/companies?search=${SEARCH_TERM}" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -w "\nStatus: %{http_code}\n" \
        -s | jq '.' || cat
    echo ""
fi

# Test 6: GET /api/companies (pagination)
echo "📋 Test 6: GET /api/companies (pagination)"
read -p "هل تريد اختبار pagination؟ (y/n): " TEST_PAGINATION
if [ "$TEST_PAGINATION" = "y" ]; then
    echo "GET ${BASE_URL}/api/companies?page=1&pageSize=5"
    curl -X GET "${BASE_URL}/api/companies?page=1&pageSize=5" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -w "\nStatus: %{http_code}\n" \
        -s | jq '.' || cat
    echo ""
fi

# Test 7: DELETE /api/companies/:id
if [ -n "$TEST_COMPANY_ID" ] && [ "$TEST_COMPANY_ID" != "null" ]; then
    echo "📋 Test 7: DELETE /api/companies/:id"
    echo -e "${YELLOW}⚠️  تحذير: هذا سيحذف الشركة ${TEST_COMPANY_ID}${NC}"
    read -p "هل تريد حذف الشركة ${TEST_COMPANY_ID}؟ (y/n): " DELETE_COMPANY
    if [ "$DELETE_COMPANY" = "y" ]; then
        echo "DELETE ${BASE_URL}/api/companies/${TEST_COMPANY_ID}"
        curl -X DELETE "${BASE_URL}/api/companies/${TEST_COMPANY_ID}" \
            -H "Authorization: Bearer ${TOKEN}" \
            -H "Content-Type: application/json" \
            -w "\nStatus: %{http_code}\n" \
            -s | jq '.' || cat
        echo ""
    fi
fi

# Test 8: GET /api/companies (unauthorized)
echo "📋 Test 8: GET /api/companies (unauthorized - 401)"
read -p "هل تريد اختبار unauthorized access؟ (y/n): " TEST_UNAUTHORIZED
if [ "$TEST_UNAUTHORIZED" = "y" ]; then
    echo "GET ${BASE_URL}/api/companies (بدون token)"
    curl -X GET "${BASE_URL}/api/companies" \
        -H "Content-Type: application/json" \
        -w "\nStatus: %{http_code}\n" \
        -s | jq '.' || cat
    echo ""
fi

# Test 9: GET /api/companies/99999 (404)
echo "📋 Test 9: GET /api/companies/99999 (404 - non-existent)"
read -p "هل تريد اختبار non-existent company؟ (y/n): " TEST_404
if [ "$TEST_404" = "y" ]; then
    echo "GET ${BASE_URL}/api/companies/99999"
    curl -X GET "${BASE_URL}/api/companies/99999" \
        -H "Authorization: Bearer ${TOKEN}" \
        -H "Content-Type: application/json" \
        -w "\nStatus: %{http_code}\n" \
        -s | jq '.' || cat
    echo ""
fi

echo "✅ انتهى الاختبار!"
echo ""
echo "📝 ملاحظة: سجل النتائج في ملف:"
echo "TESTING/RESULTS/06_COMPANY_MANAGEMENT_TEST_EXECUTION_RESULTS.md"

