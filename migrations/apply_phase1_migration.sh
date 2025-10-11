#!/bin/bash

# =====================================================
# Script لتطبيق Phase 1 Migration
# FixZone ERP - Inventory Module
# =====================================================

# الألوان
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 FixZone Phase 1 Migration${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# إعدادات
DB_NAME="FZ"
DB_USER="root"
MIGRATION_FILE="./inventory_phase1_migration.sql"

# التحقق من وجود ملف Migration
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ ملف Migration غير موجود: $MIGRATION_FILE${NC}"
    exit 1
fi

# تحذير
echo -e "${RED}⚠️  تحذير مهم:${NC}"
echo -e "${YELLOW}هذا الـ Script سيطبق تعديلات كبيرة على قاعدة البيانات${NC}"
echo -e "${YELLOW}تأكد من:${NC}"
echo -e "${YELLOW}  1. ✅ عمل نسخة احتياطية (backup_database.sh)${NC}"
echo -e "${YELLOW}  2. ✅ إيقاف السيرفر أو عدم وجود مستخدمين نشطين${NC}"
echo -e "${YELLOW}  3. ✅ قراءة PHASE1_MIGRATION_README.md${NC}"
echo ""
echo -e "${RED}هل أنت متأكد من المتابعة؟ (yes/no)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}تم الإلغاء.${NC}"
    exit 0
fi

# طلب كلمة المرور
echo ""
echo -e "${YELLOW}من فضلك أدخل كلمة مرور MySQL:${NC}"
read -s DB_PASS

echo ""
echo -e "${BLUE}⏳ جاري تطبيق الـ Migration...${NC}"
echo ""

# تطبيق Migration
mysql -u $DB_USER -p$DB_PASS $DB_NAME < $MIGRATION_FILE

# التحقق من النجاح
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ تم تطبيق الـ Migration بنجاح!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # التحقق من الجداول الجديدة
    echo -e "${BLUE}📊 التحقق من الجداول الجديدة...${NC}"
    echo ""
    
    NEW_TABLES=$(mysql -u $DB_USER -p$DB_PASS -D $DB_NAME -se "
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'FZ' 
        AND table_name IN (
            'InventoryItemCategory',
            'InventoryItemVendor',
            'StockTransfer',
            'StockTransferItem',
            'StockCount',
            'StockCountItem',
            'VendorPayment',
            'StockAlert',
            'BarcodeScan'
        )
    ")
    
    echo -e "${GREEN}✓ الجداول الجديدة: $NEW_TABLES/9${NC}"
    
    # التحقق من الفئات
    CATEGORIES=$(mysql -u $DB_USER -p$DB_PASS -D $DB_NAME -se "SELECT COUNT(*) FROM InventoryItemCategory")
    echo -e "${GREEN}✓ الفئات الأساسية: $CATEGORIES فئات${NC}"
    
    echo ""
    echo -e "${YELLOW}📋 الخطوات التالية:${NC}"
    echo -e "${YELLOW}  1. تحقق من البيانات في قاعدة البيانات${NC}"
    echo -e "${YELLOW}  2. شغل السيرفر وجرب الصفحات${NC}"
    echo -e "${YELLOW}  3. راجع PHASE1_MIGRATION_README.md للتفاصيل${NC}"
    echo ""
    
    exit 0
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}❌ فشل تطبيق الـ Migration!${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${RED}الإجراءات المقترحة:${NC}"
    echo -e "${RED}  1. راجع الأخطاء أعلاه${NC}"
    echo -e "${RED}  2. استعد النسخة الاحتياطية إذا لزم الأمر${NC}"
    echo -e "${RED}  3. راجع PHASE1_MIGRATION_README.md${NC}"
    echo ""
    exit 1
fi

