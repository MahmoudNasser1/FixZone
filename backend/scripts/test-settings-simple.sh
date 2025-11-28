#!/bin/bash
# Simple test script for Settings API using curl

API_BASE="http://localhost:4000"
EMAIL="admin@fixzone.com"
PASSWORD="password"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🧪 اختبار Settings API Endpoints                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Login and get cookie
echo "🔐 تسجيل الدخول..."
LOGIN_RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"loginIdentifier\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "$LOGIN_RESPONSE" | grep -q "success" && echo "✅ تم تسجيل الدخول" || echo "❌ فشل تسجيل الدخول: $LOGIN_RESPONSE"
echo ""

# Test Company Settings
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 اختبار إعدادات الشركة"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣ GET /api/settings/company"
RESPONSE=$(curl -s -b /tmp/cookies.txt "$API_BASE/api/settings/company")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "2️⃣ PUT /api/settings/company"
RESPONSE=$(curl -s -b /tmp/cookies.txt -X PUT "$API_BASE/api/settings/company" \
  -H "Content-Type: application/json" \
  -d '{"name":"FixZone Test","address":"عنوان تجريبي","phone":"01270388043","website":"https://fixzzone.com","logoUrl":"/logo.png"}')
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test Currency Settings
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💰 اختبار إعدادات العملة"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣ GET /api/settings/currency"
RESPONSE=$(curl -s -b /tmp/cookies.txt "$API_BASE/api/settings/currency")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "2️⃣ PUT /api/settings/currency"
RESPONSE=$(curl -s -b /tmp/cookies.txt -X PUT "$API_BASE/api/settings/currency" \
  -H "Content-Type: application/json" \
  -d '{"code":"EGP","symbol":"ج.م","name":"الجنيه المصري","locale":"ar-EG","minimumFractionDigits":2,"position":"after"}')
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test Printing Settings
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🖨️  اختبار إعدادات الطباعة"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣ GET /api/settings/printing"
RESPONSE=$(curl -s -b /tmp/cookies.txt "$API_BASE/api/settings/printing")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "2️⃣ PUT /api/settings/printing"
RESPONSE=$(curl -s -b /tmp/cookies.txt -X PUT "$API_BASE/api/settings/printing" \
  -H "Content-Type: application/json" \
  -d '{"defaultCopy":"customer","showWatermark":true,"paperSize":"A4","showSerialBarcode":true}')
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test Locale Settings
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 اختبار إعدادات المحلية"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣ GET /api/settings/locale"
RESPONSE=$(curl -s -b /tmp/cookies.txt "$API_BASE/api/settings/locale")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "2️⃣ PUT /api/settings/locale"
RESPONSE=$(curl -s -b /tmp/cookies.txt -X PUT "$API_BASE/api/settings/locale" \
  -H "Content-Type: application/json" \
  -d '{"rtl":true,"dateFormat":"yyyy/MM/dd"}')
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "✅ تم الانتهاء من الاختبارات"
rm -f /tmp/cookies.txt

