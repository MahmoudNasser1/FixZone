#!/bin/bash
# حل مشكلة package-lock.json conflict عند Pull

cd /opt/lampp/htdocs/FixZone

echo "🔧 حل مشكلة package-lock.json conflict..."

# الحل: حفظ package.json، حذف package-lock.json، ثم pull
echo "1. حفظ package.json..."
cp frontend/react-app/package.json frontend/react-app/package.json.backup

echo "2. حذف package-lock.json (سيتم إعادة إنشاؤه لاحقاً)..."
rm -f frontend/react-app/package-lock.json

echo "3. إزالة package-lock.json من git tracking..."
git rm --cached frontend/react-app/package-lock.json 2>/dev/null || true

echo "4. Pull التحديثات..."
git pull origin main

echo "5. إعادة تثبيت dependencies (سيُنشئ package-lock.json جديد)..."
cd frontend/react-app
npm install
cd ../..

echo "✅ تم! package-lock.json تم إعادة إنشاؤه."

