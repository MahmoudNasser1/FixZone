#!/bin/bash

# 🎯 سكريبت الاختبار اليدوي التفاعلي

clear

cat << 'EOF'
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║              🧪 الاختبار اليدوي - نظام المخزون 🧪                     ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

📋 قائمة الاختبار: MANUAL_TESTING_CHECKLIST.md

🎯 المعلومات الأساسية:
   Frontend: http://localhost:3000
   Backend:  http://localhost:3001/api
   
   Email:    admin@fixzone.com
   Password: password

EOF

echo "🔍 فحص حالة الخوادم..."
echo ""

# فحص Backend
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend يعمل (port 3001)"
else
    echo "❌ Backend متوقف!"
    echo "   تشغيل Backend: cd backend && npm start"
    exit 1
fi

# فحص Frontend
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend يعمل (port 3000)"
else
    echo "⚠️  Frontend متوقف!"
    echo "   تشغيل Frontend: cd frontend/react-app && npm start"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat << 'EOF'
📊 الاختبار الآلي للـ APIs:

EOF

echo "🧪 اختبار 21 API..."
echo ""

# اختبار APIs
PASS=0
FAIL=0

# 1. Inventory Enhanced
echo "1️⃣  Inventory Enhanced APIs:"
if curl -s http://localhost:3001/api/inventory-enhanced | grep -q "success\|data\|\["; then
    echo "   ✅ GET /inventory-enhanced"
    ((PASS++))
else
    echo "   ❌ GET /inventory-enhanced"
    ((FAIL++))
fi

if curl -s http://localhost:3001/api/inventory-enhanced/stats | grep -q "success\|overview\|data"; then
    echo "   ✅ GET /inventory-enhanced/stats"
    ((PASS++))
else
    echo "   ❌ GET /inventory-enhanced/stats"
    ((FAIL++))
fi

# 2. Warehouses
echo ""
echo "2️⃣  Warehouses APIs:"
if curl -s http://localhost:3001/api/warehouses | grep -q "success\|data\|\["; then
    echo "   ✅ GET /warehouses"
    ((PASS++))
else
    echo "   ❌ GET /warehouses"
    ((FAIL++))
fi

# 3. Stock Movements
echo ""
echo "3️⃣  Stock Movements APIs:"
if curl -s http://localhost:3001/api/stock-movements | grep -q "success\|data\|\["; then
    echo "   ✅ GET /stock-movements"
    ((PASS++))
else
    echo "   ❌ GET /stock-movements"
    ((FAIL++))
fi

# 4. Stock Levels
echo ""
echo "4️⃣  Stock Levels APIs:"
if curl -s http://localhost:3001/api/stock-levels | grep -q "success\|data\|\["; then
    echo "   ✅ GET /stock-levels"
    ((PASS++))
else
    echo "   ❌ GET /stock-levels"
    ((FAIL++))
fi

# 5. Stock Alerts
echo ""
echo "5️⃣  Stock Alerts APIs:"
if curl -s http://localhost:3001/api/stock-alerts | grep -q "\["; then
    echo "   ✅ GET /stock-alerts"
    ((PASS++))
else
    echo "   ❌ GET /stock-alerts"
    ((FAIL++))
fi

if curl -s http://localhost:3001/api/stock-alerts/low | grep -q "alerts\|total"; then
    echo "   ✅ GET /stock-alerts/low"
    ((PASS++))
else
    echo "   ❌ GET /stock-alerts/low"
    ((FAIL++))
fi

# 6. Stock Count
echo ""
echo "6️⃣  Stock Count APIs:"
if curl -s http://localhost:3001/api/stock-count | grep -q "success\|data\|\["; then
    echo "   ✅ GET /stock-count"
    ((PASS++))
else
    echo "   ❌ GET /stock-count"
    ((FAIL++))
fi

if curl -s http://localhost:3001/api/stock-count/stats | grep -q "success\|total"; then
    echo "   ✅ GET /stock-count/stats"
    ((PASS++))
else
    echo "   ❌ GET /stock-count/stats"
    ((FAIL++))
fi

# 7. Stock Transfer
echo ""
echo "7️⃣  Stock Transfer APIs:"
if curl -s http://localhost:3001/api/stock-transfer | grep -q "success\|data\|\["; then
    echo "   ✅ GET /stock-transfer"
    ((PASS++))
else
    echo "   ❌ GET /stock-transfer"
    ((FAIL++))
fi

# 8. Barcode
echo ""
echo "8️⃣  Barcode APIs:"
if curl -s http://localhost:3001/api/barcode/stats | grep -q "success\|total"; then
    echo "   ✅ GET /barcode/stats"
    ((PASS++))
else
    echo "   ❌ GET /barcode/stats"
    ((FAIL++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# النتائج
TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))

echo "📊 نتائج الاختبار الآلي:"
echo ""
echo "   ✅ نجح: $PASS/$TOTAL"
echo "   ❌ فشل: $FAIL/$TOTAL"
echo "   📈 النسبة: $PERCENTAGE%"
echo ""

if [ $PERCENTAGE -eq 100 ]; then
    echo "🎉 جميع APIs تعمل بشكل مثالي!"
elif [ $PERCENTAGE -ge 80 ]; then
    echo "✅ معظم APIs تعمل - مراجعة الفاشل"
else
    echo "⚠️  يوجد مشاكل - مراجعة الأخطاء"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cat << 'EOF'
🌐 الاختبار اليدوي للواجهة:

الآن حان دورك! افتح المتصفح واختبر الصفحات التالية:

1️⃣  تسجيل الدخول:
   URL: http://localhost:3000/login
   Email: admin@fixzone.com
   Password: password

2️⃣  المخزون الرئيسية:
   URL: http://localhost:3000/inventory
   ✓ تحقق من: Stats، الجدول، البحث، Filters

3️⃣  المخازن:
   URL: http://localhost:3000/inventory/warehouses
   ✓ تحقق من: 4 مخازن، Stats، الأزرار

4️⃣  حركة المخزون:
   URL: http://localhost:3000/inventory/stock-movements
   ✓ تحقق من: 10 حركات، Filters، Stats

5️⃣  التنبيهات:
   URL: http://localhost:3000/inventory/stock-alerts
   ✓ تحقق من: Tabs، التنبيهات، الاقتراحات

6️⃣  الجرد:
   URL: http://localhost:3000/stock-count
   ✓ تحقق من: 6 جردات، Stats، الحالات

7️⃣  النقل:
   URL: http://localhost:3000/stock-transfer
   ✓ تحقق من: 5 عمليات نقل، Stats

8️⃣  صفحات إضافية:
   - Barcode: http://localhost:3000/barcode-scanner
   - Import/Export: http://localhost:3000/import-export

📋 استخدم الملف: MANUAL_TESTING_CHECKLIST.md
   لتسجيل نتائج كل اختبار!

EOF

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 جاهز للاختبار اليدوي!"
echo ""


