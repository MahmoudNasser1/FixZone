#!/bin/bash

# Script to run all technician and shipping migrations
# Usage: ./run_all_migrations.sh [database_name] [mysql_user] [mysql_password]

DB_NAME="${1:-FZ}"
MYSQL_USER="${2:-root}"
MYSQL_PASS="${3:-}"

echo "🔄 جاري تشغيل المايجريشنز على قاعدة البيانات: $DB_NAME"
echo "=========================================="

# Array of migration files to run
MIGRATIONS=(
    "20250112_create_technician_performance.sql"
    "20250112_create_technician_repairs.sql"
    "20250112_create_technician_schedules.sql"
    "20250112_create_technician_skills.sql"
    "20250112_create_technician_wages.sql"
    "add_shipping_amount_production_final.sql"
    "add_shipping_amount_to_invoice.sql"
    "PRODUCTION_ADD_SHIPPING_AMOUNT.sql"
)

# Run migrations
for migration in "${MIGRATIONS[@]}"; do
    if [ -f "$migration" ]; then
        echo "📄 جاري تشغيل: $migration"
        if [ -z "$MYSQL_PASS" ]; then
            mysql -u "$MYSQL_USER" -p "$DB_NAME" < "$migration"
        else
            mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" "$DB_NAME" < "$migration"
        fi
        
        if [ $? -eq 0 ]; then
            echo "✅ تم بنجاح: $migration"
        else
            echo "❌ فشل: $migration"
            exit 1
        fi
        echo "---"
    else
        echo "⚠️  الملف غير موجود: $migration"
    fi
done

echo "=========================================="
echo "✅ تم تشغيل جميع المايجريشنز بنجاح!"

