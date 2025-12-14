#!/bin/bash

# حل نهائي لمشكلة package-lock.json في git pull

cd /opt/lampp/htdocs/FixZone

echo "🔧 جاري حل مشكلة package-lock.json..."

# 1. حفظ نسخة احتياطية
echo "📦 حفظ نسخة احتياطية..."
cp frontend/react-app/package-lock.json frontend/react-app/package-lock.json.local 2>/dev/null || true

# 2. إعادة تعيين الملف من git
echo "🔄 إعادة تعيين الملف..."
git checkout HEAD -- frontend/react-app/package-lock.json 2>/dev/null || true
git reset HEAD frontend/react-app/package-lock.json 2>/dev/null || true

# 3. حذف الملف مؤقتاً
echo "🗑️  حذف الملف مؤقتاً..."
rm -f frontend/react-app/package-lock.json

# 4. إعادة الملف من git
echo "📥 إعادة الملف من git..."
git checkout HEAD -- frontend/react-app/package-lock.json 2>/dev/null || true

# 5. تنظيف git
echo "🧹 تنظيف git..."
git clean -fd frontend/react-app/package-lock.json 2>/dev/null || true

# 6. إعادة تعيين كامل
echo "🔄 إعادة تعيين كامل..."
git reset --hard HEAD

echo "✅ تم التحضير. الآن جرب:"
echo "   git pull https://github.com/MahmoudNasser1/FixZone"
echo ""
echo "أو إذا استمرت المشكلة، استخدم:"
echo "   git pull -X theirs https://github.com/MahmoudNasser1/FixZone"

