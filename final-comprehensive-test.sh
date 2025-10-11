#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║         🧪 الاختبار النهائي الشامل الكامل 🧪                 ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# 1. فحص الخوادم
echo "📡 1. فحص الخوادم:"
echo "   Backend (3001):" $(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null || echo "❌")
echo "   Frontend (3000):" $(curl -s http://localhost:3000 > /dev/null 2>&1 && echo "✅ OK" || echo "❌")
echo ""

# 2. فحص البيانات
echo "📊 2. فحص البيانات:"
cd /opt/lampp/htdocs/FixZone/backend
node -e "
const db = require('./db');
(async () => {
  const tables = ['InventoryItem', 'Warehouse', 'StockLevel', 'StockMovement', 'StockCount', 'StockTransfer'];
  for (const t of tables) {
    const [r] = await db.execute(\`SELECT COUNT(*) as c FROM \${t}\`);
    console.log(\`   \${t.padEnd(20)}: \${r[0].c} سجل\`);
  }
  process.exit(0);
})();
"
echo ""

# 3. اختبار APIs
echo "🔌 3. اختبار Backend APIs:"
cd /opt/lampp/htdocs/FixZone
node testing/complete-system-test.js 2>&1

