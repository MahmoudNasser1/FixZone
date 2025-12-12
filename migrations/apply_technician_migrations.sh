#!/bin/bash

# =====================================================
# Script لتطبيق Technician Migrations
# FixZone ERP - Technician Module Migrations
# =====================================================

# الألوان
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 FixZone Technician Migrations${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# إعدادات
DB_NAME="FZ"
DB_USER="root"
BACKUP_DIR="./backups"

# إنشاء مجلد النسخ الاحتياطي إذا لم يكن موجوداً
mkdir -p $BACKUP_DIR

# تحذير
echo -e "${RED}⚠️  تحذير مهم:${NC}"
echo -e "${YELLOW}هذا الـ Script سيطبق تعديلات على قاعدة البيانات${NC}"
echo -e "${YELLOW}تأكد من:${NC}"
echo -e "${YELLOW}  1. ✅ عمل نسخة احتياطية${NC}"
echo -e "${YELLOW}  2. ✅ إيقاف السيرفر أو عدم وجود مستخدمين نشطين${NC}"
echo ""
echo -e "${RED}هل تريد عمل نسخة احتياطية أولاً؟ (yes/no)${NC}"
read -r BACKUP_CONFIRM

if [ "$BACKUP_CONFIRM" = "yes" ]; then
    BACKUP_FILE="$BACKUP_DIR/backup_before_technician_migrations_$(date +%Y%m%d_%H%M%S).sql"
    echo ""
    echo -e "${YELLOW}من فضلك أدخل كلمة مرور MySQL:${NC}"
    read -s DB_PASS
    echo ""
    echo -e "${BLUE}⏳ جاري عمل نسخة احتياطية...${NC}"
    mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ تم عمل النسخة الاحتياطية: $BACKUP_FILE${NC}"
    else
        echo -e "${RED}❌ فشل عمل النسخة الاحتياطية!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  تم تخطي النسخة الاحتياطية${NC}"
    echo -e "${YELLOW}من فضلك أدخل كلمة مرور MySQL:${NC}"
    read -s DB_PASS
fi

echo ""
echo -e "${BLUE}⏳ جاري تطبيق الـ Migrations...${NC}"
echo ""

# قائمة ملفات Migration بالترتيب
MIGRATIONS=(
    "../backend/migrations/20250127_create_technician_notes.sql"
    "../backend/migrations/20250127_create_technician_reports.sql"
    "../backend/migrations/20250127_create_technician_tasks.sql"
    "../backend/migrations/20250127_create_technician_time_tracking.sql"
    "./add_deletedAt_to_inspection_reports_PRODUCTION.sql"
)

# تطبيق كل migration
SUCCESS_COUNT=0
FAILED_COUNT=0

for MIGRATION_FILE in "${MIGRATIONS[@]}"; do
    if [ ! -f "$MIGRATION_FILE" ]; then
        echo -e "${RED}❌ ملف Migration غير موجود: $MIGRATION_FILE${NC}"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        continue
    fi
    
    echo -e "${BLUE}📄 جاري تطبيق: $(basename $MIGRATION_FILE)${NC}"
    
    mysql -u $DB_USER -p$DB_PASS $DB_NAME < $MIGRATION_FILE
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ تم تطبيق: $(basename $MIGRATION_FILE)${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}❌ فشل تطبيق: $(basename $MIGRATION_FILE)${NC}"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
    echo ""
done

# النتيجة النهائية
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}📊 النتيجة النهائية:${NC}"
echo -e "${GREEN}✅ نجح: $SUCCESS_COUNT${NC}"
echo -e "${RED}❌ فشل: $FAILED_COUNT${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $FAILED_COUNT -eq 0 ]; then
    echo -e "${GREEN}🎉 تم تطبيق جميع الـ Migrations بنجاح!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  بعض الـ Migrations فشلت. راجع الأخطاء أعلاه.${NC}"
    exit 1
fi
