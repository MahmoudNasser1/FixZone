#!/bin/bash
# اختبار شامل لوحدة Notifications API

echo "========================================="
echo "🔔 اختبار وحدة Notifications API"
echo "========================================="
echo ""

# الحصول على Token
echo "1. الحصول على Token..."
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"loginIdentifier":"ahmed","password":"ahmed"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ فشل الحصول على Token"
  exit 1
fi

echo "✅ Token تم الحصول عليه: ${TOKEN:0:30}..."
echo ""

# Test 1: GET /api/notifications/unread/count
echo "2. Test: GET /api/notifications/unread/count"
RESULT=$(curl -s -X GET "http://localhost:4000/api/notifications/unread/count" \
  -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:4000/api/notifications/unread/count" \
  -H "Authorization: Bearer $TOKEN")
echo "   Status: $STATUS"
echo "   Response: $RESULT" | head -c 200
echo ""
echo ""

# Test 2: GET /api/notifications
echo "3. Test: GET /api/notifications"
RESULT=$(curl -s -X GET "http://localhost:4000/api/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:4000/api/notifications?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")
echo "   Status: $STATUS"
echo "   Response: $RESULT" | head -c 200
echo ""
echo ""

# Test 3: POST /api/notifications
echo "4. Test: POST /api/notifications"
RESULT=$(curl -s -X POST "http://localhost:4000/api/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"info","message":"Test notification from curl","channel":"IN_APP"}')
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:4000/api/notifications" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"info","message":"Test notification from curl","channel":"IN_APP"}')
NOTIFICATION_ID=$(echo $RESULT | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "   Status: $STATUS"
echo "   Response: $RESULT" | head -c 200
echo "   Notification ID: $NOTIFICATION_ID"
echo ""
echo ""

if [ -n "$NOTIFICATION_ID" ]; then
  # Test 4: GET /api/notifications/:id
  echo "5. Test: GET /api/notifications/$NOTIFICATION_ID"
  RESULT=$(curl -s -X GET "http://localhost:4000/api/notifications/$NOTIFICATION_ID" \
    -H "Authorization: Bearer $TOKEN")
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:4000/api/notifications/$NOTIFICATION_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "   Status: $STATUS"
  echo "   Response: $RESULT" | head -c 200
  echo ""
  echo ""
  
  # Test 5: PUT /api/notifications/:id
  echo "6. Test: PUT /api/notifications/$NOTIFICATION_ID"
  RESULT=$(curl -s -X PUT "http://localhost:4000/api/notifications/$NOTIFICATION_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message":"Updated notification from curl"}')
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "http://localhost:4000/api/notifications/$NOTIFICATION_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"message":"Updated notification from curl"}')
  echo "   Status: $STATUS"
  echo "   Response: $RESULT" | head -c 200
  echo ""
  echo ""
  
  # Test 6: PATCH /api/notifications/:id/read
  echo "7. Test: PATCH /api/notifications/$NOTIFICATION_ID/read"
  RESULT=$(curl -s -X PATCH "http://localhost:4000/api/notifications/$NOTIFICATION_ID/read" \
    -H "Authorization: Bearer $TOKEN")
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "http://localhost:4000/api/notifications/$NOTIFICATION_ID/read" \
    -H "Authorization: Bearer $TOKEN")
  echo "   Status: $STATUS"
  echo "   Response: $RESULT" | head -c 200
  echo ""
  echo ""
  
  # Test 7: PATCH /api/notifications/read/all
  echo "8. Test: PATCH /api/notifications/read/all"
  RESULT=$(curl -s -X PATCH "http://localhost:4000/api/notifications/read/all" \
    -H "Authorization: Bearer $TOKEN")
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "http://localhost:4000/api/notifications/read/all" \
    -H "Authorization: Bearer $TOKEN")
  echo "   Status: $STATUS"
  echo "   Response: $RESULT" | head -c 200
  echo ""
  echo ""
  
  # Test 8: GET /api/notifications (with filters)
  echo "9. Test: GET /api/notifications?isRead=false"
  RESULT=$(curl -s -X GET "http://localhost:4000/api/notifications?isRead=false&page=1&limit=10" \
    -H "Authorization: Bearer $TOKEN")
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:4000/api/notifications?isRead=false&page=1&limit=10" \
    -H "Authorization: Bearer $TOKEN")
  echo "   Status: $STATUS"
  echo "   Response: $RESULT" | head -c 200
  echo ""
  echo ""
  
  # Test 9: DELETE /api/notifications/:id
  echo "10. Test: DELETE /api/notifications/$NOTIFICATION_ID"
  RESULT=$(curl -s -X DELETE "http://localhost:4000/api/notifications/$NOTIFICATION_ID" \
    -H "Authorization: Bearer $TOKEN")
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "http://localhost:4000/api/notifications/$NOTIFICATION_ID" \
    -H "Authorization: Bearer $TOKEN")
  echo "   Status: $STATUS"
  echo "   Response: $RESULT" | head -c 200
  echo ""
  echo ""
fi

# Test 10: Authorization - Try to access non-existent notification
echo "11. Test: GET /api/notifications/99999 (non-existent)"
RESULT=$(curl -s -X GET "http://localhost:4000/api/notifications/99999" \
  -H "Authorization: Bearer $TOKEN")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:4000/api/notifications/99999" \
  -H "Authorization: Bearer $TOKEN")
echo "   Status: $STATUS (Expected: 404)"
echo "   Response: $RESULT" | head -c 200
echo ""
echo ""

# Test 11: Unauthorized Access
echo "12. Test: GET /api/notifications (without token)"
RESULT=$(curl -s -X GET "http://localhost:4000/api/notifications")
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "http://localhost:4000/api/notifications")
echo "   Status: $STATUS (Expected: 401)"
echo "   Response: $RESULT" | head -c 200
echo ""
echo ""

echo "========================================="
echo "✅ انتهى الاختبار"
echo "========================================="

