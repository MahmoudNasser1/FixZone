#!/bin/bash

# =====================================================
# Script للنسخ الاحتياطي لقاعدة البيانات
# FixZone ERP - Database Backup
# =====================================================

# الألوان للرسائل
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}📦 FixZone Database Backup Script${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# إعدادات قاعدة البيانات
DB_NAME="FZ"
DB_USER="root"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/FZ_backup_${TIMESTAMP}.sql"

# إنشاء مجلد Backups إن لم يكن موجوداً
mkdir -p $BACKUP_DIR

# طلب كلمة المرور
echo -e "${YELLOW}من فضلك أدخل كلمة مرور MySQL:${NC}"
read -s DB_PASS

echo ""
echo -e "${YELLOW}⏳ جاري إنشاء النسخة الاحتياطية...${NC}"

# تنفيذ النسخ الاحتياطي
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE 2>&1

# التحقق من النجاح
if [ $? -eq 0 ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo ""
    echo -e "${GREEN}✅ تم إنشاء النسخة الاحتياطية بنجاح!${NC}"
    echo -e "${GREEN}📁 الملف: $BACKUP_FILE${NC}"
    echo -e "${GREEN}📊 الحجم: $FILE_SIZE${NC}"
    echo ""
    echo -e "${YELLOW}💾 احتفظ بهذا الملف في مكان آمن!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ فشل إنشاء النسخة الاحتياطية!${NC}"
    echo -e "${RED}تحقق من:${NC}"
    echo -e "${RED}  1. اسم المستخدم وكلمة المرور${NC}"
    echo -e "${RED}  2. اسم قاعدة البيانات (FZ)${NC}"
    echo -e "${RED}  3. أن MySQL يعمل${NC}"
    rm -f $BACKUP_FILE
    exit 1
fi

