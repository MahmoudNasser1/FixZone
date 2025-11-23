#!/bin/bash
# Test script for Customer Management API
# Date: 2025-11-17

BASE_URL="http://localhost:4000/api"
COOKIE_JAR="cookie_jar_customer.txt"

echo "========================================="
echo "Customer Management - API Tests"
echo "========================================="
echo ""

# Login first
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"admin@fixzone.com","password":"admin123"}')
echo "$LOGIN_RESPONSE" | jq '.' || echo "$LOGIN_RESPONSE"
echo ""

# Test 1: GET /customers (without auth)
echo "2. Testing GET /customers (without auth)..."
curl -s "$BASE_URL/customers" \
  | jq '. | length' || echo "Test failed"
echo ""

# Test 2: GET /customers (with auth)
echo "3. Testing GET /customers (with auth)..."
curl -s -b "$COOKIE_JAR" "$BASE_URL/customers" \
  | jq '. | length' || echo "Test failed"
echo ""

# Test 3: GET /customers (with pagination)
echo "4. Testing GET /customers (with pagination)..."
curl -s -b "$COOKIE_JAR" "$BASE_URL/customers?page=1&pageSize=10" \
  | jq '{total: .data.total, page: .data.page, customers: (.data.customers | length)}' || echo "Test failed"
echo ""

# Test 4: Search customers
echo "5. Testing Search customers..."
curl -s -b "$COOKIE_JAR" "$BASE_URL/customers/search?q=test" \
  | jq '{total: .pagination.total, data: (.data | length)}' || echo "Test failed"
echo ""

# Test 5: GET customer by ID
echo "6. Testing GET customer by ID..."
CUSTOMER_ID=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/customers?page=1&pageSize=1" \
  | jq -r '.data.customers[0].id // empty')
if [ ! -z "$CUSTOMER_ID" ]; then
  curl -s -b "$COOKIE_JAR" "$BASE_URL/customers/$CUSTOMER_ID" \
    | jq '{success: .success, name: .data.name, phone: .data.phone}' || echo "Test failed"
  echo "Customer ID: $CUSTOMER_ID"
else
  echo "No customer found to test"
fi
echo ""

# Test 6: Create customer
echo "7. Testing Create customer..."
CUSTOMER_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -d '{"name":"عميل اختبار API","phone":"01234567890","email":"test@test.com","address":"عنوان اختبار"}')
echo "$CUSTOMER_RESPONSE" | jq '.'
NEW_CUSTOMER_ID=$(echo "$CUSTOMER_RESPONSE" | jq -r '.customer.id // empty')
echo "New Customer ID: $NEW_CUSTOMER_ID"
echo ""

# Test 7: Create customer (duplicate phone)
echo "8. Testing Create customer (duplicate phone)..."
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -d '{"name":"عميل اختبار 2","phone":"01234567890","email":"test2@test.com"}' \
  | jq '.message // .error' || echo "Test failed"
echo ""

# Test 8: Create customer (missing fields)
echo "9. Testing Create customer (missing fields)..."
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/customers" \
  -H "Content-Type: application/json" \
  -d '{"name":"عميل ناقص"}' \
  | jq '.message // .error' || echo "Test failed"
echo ""

# Test 9: Update customer
echo "10. Testing Update customer..."
if [ ! -z "$NEW_CUSTOMER_ID" ]; then
  curl -s -b "$COOKIE_JAR" -X PUT "$BASE_URL/customers/$NEW_CUSTOMER_ID" \
    -H "Content-Type: application/json" \
    -d '{"name":"عميل اختبار API محدث","email":"updated@test.com"}' \
    | jq '.message // .error' || echo "Test failed"
else
  echo "No customer to update"
fi
echo ""

# Test 10: Update customer (duplicate phone)
echo "11. Testing Update customer (duplicate phone)..."
if [ ! -z "$NEW_CUSTOMER_ID" ] && [ ! -z "$CUSTOMER_ID" ]; then
  EXISTING_PHONE=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/customers/$CUSTOMER_ID" \
    | jq -r '.data.phone // empty')
  if [ ! -z "$EXISTING_PHONE" ]; then
    curl -s -b "$COOKIE_JAR" -X PUT "$BASE_URL/customers/$NEW_CUSTOMER_ID" \
      -H "Content-Type: application/json" \
      -d "{\"phone\":\"$EXISTING_PHONE\"}" \
      | jq '.message // .error' || echo "Test failed"
  else
    echo "Could not get existing phone"
  fi
else
  echo "No customers to test duplicate"
fi
echo ""

# Test 11: Get customer stats
echo "12. Testing Get customer stats..."
if [ ! -z "$CUSTOMER_ID" ]; then
  curl -s -b "$COOKIE_JAR" "$BASE_URL/customers/$CUSTOMER_ID/stats" \
    | jq '{totalRepairs: .totalRepairs, totalPaid: .totalPaid, satisfactionRate: .satisfactionRate}' || echo "Test failed"
else
  echo "No customer to test stats"
fi
echo ""

# Test 12: Get customer repairs
echo "13. Testing Get customer repairs..."
if [ ! -z "$CUSTOMER_ID" ]; then
  curl -s -b "$COOKIE_JAR" "$BASE_URL/customers/$CUSTOMER_ID/repairs" \
    | jq '{success: .success, repairsCount: (.data.repairs | length)}' || echo "Test failed"
else
  echo "No customer to test repairs"
fi
echo ""

# Test 13: Delete customer
echo "14. Testing Delete customer..."
if [ ! -z "$NEW_CUSTOMER_ID" ]; then
  curl -s -b "$COOKIE_JAR" -X DELETE "$BASE_URL/customers/$NEW_CUSTOMER_ID" \
    | jq '.message // .error' || echo "Test failed"
else
  echo "No customer to delete"
fi
echo ""

# Test 14: 404 Not Found
echo "15. Testing 404 Not Found..."
curl -s -b "$COOKIE_JAR" "$BASE_URL/customers/999999" \
  | jq '.message // .error' || echo "Test failed"
echo ""

# Cleanup
echo "========================================="
echo "Tests Completed"
echo "========================================="
rm -f "$COOKIE_JAR"


