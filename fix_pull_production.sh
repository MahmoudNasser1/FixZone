#!/bin/bash
# حل مشكلة Git Pull على Production

cd /opt/lampp/htdocs/FixZone

echo "🔧 Production Pull Fix Script"
echo "=============================="

# Backup
echo ""
echo "1. Creating backups..."
cp frontend/react-app/package.json frontend/react-app/package.json.backup 2>/dev/null || true
cp frontend/react-app/package-lock.json frontend/react-app/package-lock.json.backup 2>/dev/null || true
echo "✅ Backups created"

# Check if exceljs exists
echo ""
echo "2. Checking for important changes..."
if grep -q "exceljs" frontend/react-app/package.json; then
    echo "✅ exceljs found in package.json"
else
    echo "⚠️  WARNING: exceljs NOT found in package.json"
fi

# Remove package-lock.json
echo ""
echo "3. Removing package-lock.json (safe - will be regenerated)..."
rm -f frontend/react-app/package-lock.json
echo "✅ Removed"

# Pull
echo ""
echo "4. Pulling updates from GitHub..."
echo "   (You will need to enter username/password)"
git pull origin main

if [ $? -eq 0 ]; then
    echo "✅ Pull successful"
    
    # Install dependencies
    echo ""
    echo "5. Installing dependencies..."
    cd frontend/react-app
    npm install
    cd ../..
    echo "✅ Dependencies installed"
    
    # Verify
    echo ""
    echo "6. Verification..."
    if [ -f frontend/react-app/package-lock.json ]; then
        echo "✅ package-lock.json regenerated"
    else
        echo "❌ ERROR: package-lock.json not regenerated"
    fi
    
    if grep -q "exceljs" frontend/react-app/package.json; then
        echo "✅ exceljs still present"
    else
        echo "⚠️  WARNING: exceljs missing - you may need to add it"
    fi
    
    echo ""
    echo "✅ Done! Ready for build."
else
    echo ""
    echo "❌ Pull failed. Check errors above."
    echo "You may need to restore from backup:"
    echo "  cp frontend/react-app/package.json.backup frontend/react-app/package.json"
fi
