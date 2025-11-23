#!/bin/bash
# Test script for Services Catalog Enhancements
# Date: 2025-11-17

BASE_URL="http://localhost:4000/api"
COOKIE_JAR="cookie_jar_services.txt"

echo "========================================="
echo "Services Catalog Enhancements - API Tests"
echo "========================================="
echo ""

# Login first
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"admin@fixzone.com","password":"admin123"}')
echo "$LOGIN_RESPONSE" | jq '.' || echo "$LOGIN_RESPONSE"
echo ""

# Test 1: Backend Validation - Empty Name
echo "2. Testing Backend Validation - Empty Name..."
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/services" \
  -H "Content-Type: application/json" \
  -d '{"basePrice":100}' \
  | jq '.errors[0].message // .message // .error' || echo "Test failed"
echo ""

# Test 2: Backend Validation - Name Too Short
echo "3. Testing Backend Validation - Name Too Short..."
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/services" \
  -H "Content-Type: application/json" \
  -d '{"name":"ab","basePrice":100}' \
  | jq '.errors[0].message // .message // .error' || echo "Test failed"
echo ""

# Test 3: Backend Validation - Missing basePrice
echo "4. Testing Backend Validation - Missing basePrice..."
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/services" \
  -H "Content-Type: application/json" \
  -d '{"name":"خدمة اختبار"}' \
  | jq '.errors[0].message // .message // .error' || echo "Test failed"
echo ""

# Test 4: Backend Validation - Negative basePrice
echo "5. Testing Backend Validation - Negative basePrice..."
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/services" \
  -H "Content-Type: application/json" \
  -d '{"name":"خدمة اختبار","basePrice":-100}' \
  | jq '.errors[0].message // .message // .error' || echo "Test failed"
echo ""

# Test 5: Create Service Successfully
echo "6. Creating Service Successfully..."
SERVICE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/services" \
  -H "Content-Type: application/json" \
  -d '{"name":"خدمة اختبار التحسينات","basePrice":250,"description":"خدمة للاختبار","category":"صيانة عامة","estimatedDuration":60}')
echo "$SERVICE_RESPONSE" | jq '.'
SERVICE_ID=$(echo "$SERVICE_RESPONSE" | jq -r '.id // empty')
echo "Service ID: $SERVICE_ID"
echo ""

# Test 6: Duplicate Name Check
echo "7. Testing Duplicate Name Check..."
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/services" \
  -H "Content-Type: application/json" \
  -d '{"name":"خدمة اختبار التحسينات","basePrice":300}' \
  | jq '.message // .error' || echo "Test failed"
echo ""

# Test 7: Get Service Categories
echo "8. Testing Get Service Categories..."
curl -s -b "$COOKIE_JAR" "$BASE_URL/servicecategories" \
  | jq '.categories | length' || echo "Test failed"
echo ""

# Test 8: Get Active Categories Only
echo "9. Testing Get Active Categories Only..."
curl -s -b "$COOKIE_JAR" "$BASE_URL/servicecategories?isActive=true" \
  | jq '.categories | length' || echo "Test failed"
echo ""

# Test 9: Create Service Category (Admin)
echo "10. Testing Create Service Category..."
CATEGORY_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/servicecategories" \
  -H "Content-Type: application/json" \
  -d '{"name":"فئة اختبار التحسينات","description":"فئة للاختبار","color":"#FF0000","icon":"Test"}')
echo "$CATEGORY_RESPONSE" | jq '.'
CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | jq -r '.id // empty')
echo "Category ID: $CATEGORY_ID"
echo ""

# Test 10: Duplicate Category Check
echo "11. Testing Duplicate Category Check..."
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/servicecategories" \
  -H "Content-Type: application/json" \
  -d '{"name":"فئة اختبار التحسينات","color":"#00FF00"}' \
  | jq '.message // .error' || echo "Test failed"
echo ""

# Test 11: Calculate Service Price (No Rules)
echo "12. Testing Calculate Service Price (No Rules)..."
if [ ! -z "$SERVICE_ID" ]; then
  curl -s -b "$COOKIE_JAR" "$BASE_URL/servicepricingrules/$SERVICE_ID/calculate" \
    | jq '.price' || echo "Test failed"
fi
echo ""

# Test 12: Create Pricing Rule
echo "13. Testing Create Pricing Rule..."
if [ ! -z "$SERVICE_ID" ]; then
  RULE_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/servicepricingrules" \
    -H "Content-Type: application/json" \
    -d "{\"serviceId\":$SERVICE_ID,\"deviceType\":\"phone\",\"pricingType\":\"multiplier\",\"value\":1.5,\"priority\":1}")
  echo "$RULE_RESPONSE" | jq '.'
  RULE_ID=$(echo "$RULE_RESPONSE" | jq -r '.id // empty')
  echo "Rule ID: $RULE_ID"
fi
echo ""

# Test 13: Calculate Price with Rule
echo "14. Testing Calculate Price with Rule..."
if [ ! -z "$SERVICE_ID" ]; then
  curl -s -b "$COOKIE_JAR" "$BASE_URL/servicepricingrules/$SERVICE_ID/calculate?deviceType=phone" \
    | jq '.price' || echo "Test failed"
fi
echo ""

# Test 14: Get Service Pricing Rules
echo "15. Testing Get Service Pricing Rules..."
if [ ! -z "$SERVICE_ID" ]; then
  curl -s -b "$COOKIE_JAR" "$BASE_URL/servicepricingrules/service/$SERVICE_ID" \
    | jq '.rules | length' || echo "Test failed"
fi
echo ""

# Test 15: Get Service Stats (Recent Usage)
echo "16. Testing Get Service Stats (Recent Usage)..."
if [ ! -z "$SERVICE_ID" ]; then
  curl -s -b "$COOKIE_JAR" "$BASE_URL/services/$SERVICE_ID/stats" \
    | jq '{totalUsage: .stats.totalUsage, completedUsage: .stats.completedUsage, recentUsageCount: (.recentUsage | length)}' || echo "Test failed"
fi
echo ""

# Cleanup
echo "========================================="
echo "Tests Completed"
echo "========================================="
rm -f "$COOKIE_JAR"
