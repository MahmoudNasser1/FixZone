#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Import CSV Data to Database - استيراد البيانات من CSV إلى قاعدة البيانات
هذا السكربت يقوم بقراءة ملفات CSV وإضافة البيانات إلى قاعدة البيانات
"""

import csv
import re
import os
import sys
from datetime import datetime
from decimal import Decimal
from typing import Dict, Optional, Tuple

# Try to import mysql connector, if not available, provide helpful error
try:
    import mysql.connector
    from mysql.connector import Error
except ImportError:
    print("❌ mysql-connector-python غير مثبت!")
    print("📦 يرجى تثبيته باستخدام: pip3 install mysql-connector-python")
    print("   أو: python3 -m pip install mysql-connector-python")
    sys.exit(1)

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'FZ'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

# Mapping between CSV columns and database columns
CUSTOMER_CSV_COLUMNS = {
    'الاسم': 'name',
    'رقم الجوال': 'phone',
    'المنطقة': 'address',
    'علامه': 'notes'
}

INVOICE_CSV_COLUMNS = {
    '#': 'invoice_number',
    'الفرع': 'branch_name',
    'التاريخ': 'date',
    'النوع': 'invoice_type',
    'الحالة': 'status',
    'المستخدم': 'user_name',
    'العميل': 'customer_name',
    'طريقة الدفع': 'payment_method',
    'الإجمالى': 'total_amount',
    'المدفوع': 'amount_paid',
    'المتبقى': 'remaining_amount',
    'الخدمات': 'services_amount'
}

# Arabic month names to numbers
ARABIC_MONTHS = {
    'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4,
    'مايو': 5, 'يونيو': 6, 'يوليو': 7, 'أغسطس': 8,
    'سبتمبر': 9, 'أكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12
}

# Arabic day names
ARABIC_DAYS = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']


def clean_phone(phone: str) -> str:
    """تنظيف رقم الهاتف"""
    if not phone or phone == '.' or phone == '000' or phone == '00000000000':
        return None
    # Remove non-digits except +
    cleaned = re.sub(r'[^\d+]', '', str(phone))
    if not cleaned or len(cleaned) < 8:
        return None
    return cleaned


def parse_arabic_date(date_str: str) -> Optional[datetime]:
    """تحويل التاريخ العربي إلى datetime"""
    if not date_str:
        return None
    
    try:
        # Remove day name and comma if present
        date_str = date_str.strip()
        for day in ARABIC_DAYS:
            if date_str.startswith(day):
                date_str = date_str.replace(day + ',', '').strip()
                break
        
        # Extract date parts: "٢٠ نوفمبر ٢٠٢٥"
        # Replace Arabic digits with English digits
        arabic_to_english = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
        date_str = date_str.translate(arabic_to_english)
        
        # Remove extra spaces
        date_str = ' '.join(date_str.split())
        
        # Parse date: "20 نوفمبر 2025"
        parts = date_str.split()
        if len(parts) >= 3:
            day = int(parts[0])
            month_name = parts[1]
            year = int(parts[2])
            
            month = ARABIC_MONTHS.get(month_name)
            if month:
                return datetime(year, month, day)
        
        return None
    except Exception as e:
        print(f"خطأ في تحويل التاريخ: {date_str} - {e}")
        return None


def parse_amount(amount_str: str) -> Optional[Decimal]:
    """تحويل المبلغ من نص إلى Decimal"""
    if not amount_str:
        return Decimal('0')
    
    try:
        # Replace Arabic digits
        arabic_to_english = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
        amount_str = str(amount_str).translate(arabic_to_english)
        
        # Remove commas and spaces
        amount_str = amount_str.replace(',', '').replace(' ', '').strip()
        
        if not amount_str or amount_str == '':
            return Decimal('0')
        
        return Decimal(amount_str)
    except Exception as e:
        print(f"خطأ في تحويل المبلغ: {amount_str} - {e}")
        return Decimal('0')


def map_invoice_status(status: str) -> str:
    """تحويل حالة الفاتورة من النص العربي إلى حالة في النظام"""
    status = status.strip().lower()
    
    status_map = {
        'تم الاستلام من العميل': 'pending',
        'تم الاصلاح وجاهز للاستلام ✨': 'ready',
        'تم تسليم الجهاز للعميل👍✨': 'completed',
        'مرفوض': 'rejected',
        'تحت الاختبارت النهائيه...': 'testing',
        'بانتظار قطع غيار': 'waiting_parts',
        'تم التسليم للمهندس وجارى الفحص': 'in_progress'
    }
    
    for arabic_status, english_status in status_map.items():
        if arabic_status.lower() in status:
            return english_status
    
    return 'pending'


def map_invoice_type(invoice_type: str) -> str:
    """تحويل نوع الفاتورة"""
    if 'مبيعات' in invoice_type or 'sale' in invoice_type.lower():
        return 'sale'
    elif 'صيانه' in invoice_type or 'repair' in invoice_type.lower():
        return 'sale'  # Default to sale for repairs
    return 'sale'


def get_or_create_customer(connection, customer_name: str, phone: str = None, 
                           address: str = None, notes: str = None, csv_order: int = None) -> Optional[int]:
    """الحصول على العميل أو إنشاؤه إذا لم يكن موجوداً"""
    cursor = connection.cursor()
    
    try:
        # Clean customer name
        customer_name = customer_name.strip() if customer_name else None
        if not customer_name or customer_name == '':
            return None
        
        # Try to find by name first
        cursor.execute(
            "SELECT id FROM Customer WHERE name = %s AND deletedAt IS NULL LIMIT 1",
            (customer_name,)
        )
        result = cursor.fetchone()
        if result:
            customer_id = result[0]
            # Update phone if provided and different
            if phone:
                clean_phone_num = clean_phone(phone)
                if clean_phone_num:
                    cursor.execute(
                        "UPDATE Customer SET phone = %s WHERE id = %s",
                        (clean_phone_num, customer_id)
                    )
            return customer_id
        
        # Try to find by phone if provided
        if phone:
            clean_phone_num = clean_phone(phone)
            if clean_phone_num:
                cursor.execute(
                    "SELECT id FROM Customer WHERE phone = %s AND deletedAt IS NULL LIMIT 1",
                    (clean_phone_num,)
                )
                result = cursor.fetchone()
                if result:
                    return result[0]
        
        # Create new customer
        clean_phone_num = clean_phone(phone) if phone else None
        
        # Prepare customFields with notes and CSV order
        custom_fields_parts = []
        if notes:
            custom_fields_parts.append(f'"notes": "{notes}"')
        if csv_order:
            custom_fields_parts.append(f'"csvOrder": {csv_order}')
        
        custom_fields = '{' + ', '.join(custom_fields_parts) + '}' if custom_fields_parts else None
        
        cursor.execute(
            """INSERT INTO Customer (name, phone, address, customFields, createdAt)
               VALUES (%s, %s, %s, %s, NOW())""",
            (customer_name, clean_phone_num, address, custom_fields)
        )
        
        customer_id = cursor.lastrowid
        connection.commit()
        return customer_id
        
    except Error as e:
        print(f"❌ خطأ في get_or_create_customer: {e}")
        connection.rollback()
        return None
    finally:
        cursor.close()


def get_branch_id(connection, branch_name: str) -> Optional[int]:
    """الحصول على معرف الفرع"""
    if not branch_name:
        return None
    
    cursor = connection.cursor()
    try:
        cursor.execute(
            "SELECT id FROM Branch WHERE name = %s LIMIT 1",
            (branch_name.strip(),)
        )
        result = cursor.fetchone()
        return result[0] if result else None
    except Error as e:
        print(f"❌ خطأ في get_branch_id: {e}")
        return None
    finally:
        cursor.close()


def get_user_id(connection, user_name: str) -> Optional[int]:
    """الحصول على معرف المستخدم"""
    if not user_name:
        return None
    
    cursor = connection.cursor()
    try:
        cursor.execute(
            "SELECT id FROM User WHERE name = %s LIMIT 1",
            (user_name.strip(),)
        )
        result = cursor.fetchone()
        return result[0] if result else None
    except Error as e:
        print(f"❌ خطأ في get_user_id: {e}")
        return None
    finally:
        cursor.close()


def import_customers(csv_file_path: str, connection):
    """استيراد العملاء من CSV مع الحفاظ على الترتيب"""
    print(f"\n📋 جاري استيراد العملاء من: {csv_file_path}")
    
    if not os.path.exists(csv_file_path):
        print(f"❌ الملف غير موجود: {csv_file_path}")
        return
    
    customers_imported = 0
    customers_skipped = 0
    
    try:
        cursor = connection.cursor()
        
        # Get current max ID to set AUTO_INCREMENT
        cursor.execute("SELECT MAX(id) FROM Customer")
        max_id_result = cursor.fetchone()
        current_max_id = max_id_result[0] if max_id_result[0] else 0
        
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            # Read all lines
            lines = file.readlines()
            
            # Skip BOM if present
            if lines and lines[0].startswith('\ufeff'):
                lines[0] = lines[0][1:]
            
            # Skip first line if it's a title (doesn't contain column names)
            start_line = 0
            if lines and '#' not in lines[0] and 'الاسم' not in lines[0]:
                start_line = 1
            
            # Create reader starting from actual header
            reader = csv.DictReader(lines[start_line:])
            
            # Store all customers first to maintain order
            customers_list = []
            
            for row_num, row in enumerate(reader, start=start_line+2):
                try:
                    # Skip empty rows
                    if not row.get('الاسم', '').strip():
                        continue
                    
                    # Get CSV order number (from '#' column)
                    csv_order_str = row.get('#', '').strip()
                    csv_order = int(csv_order_str) if csv_order_str and csv_order_str.isdigit() else None
                    
                    name = row.get('الاسم', '').strip()
                    phone = row.get('رقم الجوال', '').strip()
                    address = row.get('المنطقة', '').strip()
                    notes = row.get('علامه', '').strip()
                    
                    if name:
                        customers_list.append({
                            'csv_order': csv_order,
                            'name': name,
                            'phone': phone,
                            'address': address,
                            'notes': notes
                        })
                        
                except Exception as e:
                    print(f"❌ خطأ في السطر {row_num}: {e}")
                    customers_skipped += 1
                    continue
            
            # Sort by CSV order to maintain the order
            customers_list.sort(key=lambda x: x['csv_order'] if x['csv_order'] else 999999)
            
            # Insert customers in order
            for customer_data in customers_list:
                try:
                    customer_id = get_or_create_customer(
                        connection, 
                        customer_data['name'], 
                        customer_data['phone'], 
                        customer_data['address'], 
                        customer_data['notes'], 
                        customer_data['csv_order']
                    )
                    
                    if customer_id:
                        customers_imported += 1
                        if customers_imported % 50 == 0:
                            print(f"  ✅ تم استيراد {customers_imported} عميل...")
                    else:
                        customers_skipped += 1
                        
                except Exception as e:
                    print(f"❌ خطأ في إدراج العميل {customer_data['name']}: {e}")
                    customers_skipped += 1
                    continue
        
        cursor.close()
        print(f"\n✅ تم استيراد {customers_imported} عميل بالترتيب")
        if customers_skipped > 0:
            print(f"⚠️  تم تخطي {customers_skipped} عميل")
            
    except Exception as e:
        print(f"❌ خطأ في قراءة ملف العملاء: {e}")


def import_invoices(csv_file_path: str, connection, is_completed: bool = False):
    """استيراد الفواتير من CSV"""
    status_label = "المنتهية" if is_completed else "غير المقفولة"
    print(f"\n📋 جاري استيراد الفواتير {status_label} من: {csv_file_path}")
    
    if not os.path.exists(csv_file_path):
        print(f"❌ الملف غير موجود: {csv_file_path}")
        return
    
    invoices_imported = 0
    invoices_skipped = 0
    
    try:
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            # Read all lines
            lines = file.readlines()
            
            # Skip BOM if present
            if lines and lines[0].startswith('\ufeff'):
                lines[0] = lines[0][1:]
            
            # Skip first line if it's a title (doesn't contain column names)
            start_line = 0
            if lines and '#' not in lines[0] and 'الفرع' not in lines[0]:
                start_line = 1
            
            # Create reader starting from actual header
            reader = csv.DictReader(lines[start_line:])
            
            for row_num, row in enumerate(reader, start=start_line+2):
                try:
                    # Skip empty rows
                    # CSV has empty first column, so invoice number is under '#' key
                    invoice_number = row.get('#', '').strip()
                    if not invoice_number or invoice_number == '':
                        continue
                    
                    # Get customer name
                    customer_name = row.get('العميل', '').strip()
                    if not customer_name:
                        invoices_skipped += 1
                        continue
                    
                    # Get or create customer (phone is not in invoices CSV)
                    customer_id = get_or_create_customer(
                        connection, customer_name, None
                    )
                    
                    if not customer_id:
                        print(f"⚠️  لم يتم العثور على العميل: {customer_name}")
                        invoices_skipped += 1
                        continue
                    
                    # Parse invoice data
                    total_amount = parse_amount(row.get('الإجمالى', '0'))
                    amount_paid = parse_amount(row.get('المدفوع', '0'))
                    remaining_amount = parse_amount(row.get('المتبقى', '0'))
                    
                    # Parse date
                    date_str = row.get('التاريخ', '')
                    invoice_date = parse_arabic_date(date_str)
                    
                    # Map status
                    status = map_invoice_status(row.get('الحالة', 'تم الاستلام من العميل'))
                    
                    # Map invoice type
                    invoice_type = map_invoice_type(row.get('النوع', 'فاتورة صيانه'))
                    
                    # Get branch and user IDs
                    branch_name = row.get('الفرع', '').strip()
                    user_name = row.get('المستخدم', '').strip()
                    
                    # Payment method
                    payment_method = row.get('طريقة الدفع', 'كاش').strip()
                    
                    # Insert invoice
                    cursor = connection.cursor()
                    try:
                        cursor.execute(
                            """INSERT INTO Invoice 
                               (totalAmount, amountPaid, status, customerId, 
                                invoiceType, currency, notes, createdAt, updatedAt)
                               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
                            (total_amount, amount_paid, status, customer_id,
                             invoice_type, 'EGP', 
                             f'Payment Method: {payment_method}',
                             invoice_date if invoice_date else datetime.now())
                        )
                        
                        invoice_id = cursor.lastrowid
                        connection.commit()
                        invoices_imported += 1
                        
                        if invoices_imported % 50 == 0:
                            print(f"  ✅ تم استيراد {invoices_imported} فاتورة...")
                            
                    except Error as e:
                        if 'Duplicate entry' in str(e):
                            # Invoice already exists, skip
                            invoices_skipped += 1
                        else:
                            print(f"❌ خطأ في إدراج الفاتورة {invoice_number}: {e}")
                            invoices_skipped += 1
                        connection.rollback()
                    finally:
                        cursor.close()
                        
                except Exception as e:
                    print(f"❌ خطأ في السطر {row_num}: {e}")
                    invoices_skipped += 1
                    continue
        
        print(f"\n✅ تم استيراد {invoices_imported} فاتورة")
        if invoices_skipped > 0:
            print(f"⚠️  تم تخطي {invoices_skipped} فاتورة")
            
    except Exception as e:
        print(f"❌ خطأ في قراءة ملف الفواتير: {e}")


def main():
    """الدالة الرئيسية"""
    print("=" * 60)
    print("🚀 بدء استيراد البيانات من CSV إلى قاعدة البيانات")
    print("=" * 60)
    
    # Get project root directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))
    in_dir = os.path.join(project_root, 'IN')
    
    # File paths
    customers_file = os.path.join(in_dir, 'قائمة قائمة العملاء.csv')
    invoices_open_file = os.path.join(in_dir, 'الفواتير الغير مقفوله.csv')
    invoices_completed_file = os.path.join(in_dir, 'الفواتير المنتهيه.csv')
    
    # Connect to database
    try:
        print(f"\n🔌 جاري الاتصال بقاعدة البيانات: {DB_CONFIG['database']}")
        connection = mysql.connector.connect(**DB_CONFIG)
        print("✅ تم الاتصال بنجاح\n")
        
        # Import customers only
        if os.path.exists(customers_file):
            import_customers(customers_file, connection)
        else:
            print(f"⚠️  ملف العملاء غير موجود: {customers_file}")
        
        # Invoices import disabled - only importing customers
        # if os.path.exists(invoices_open_file):
        #     import_invoices(invoices_open_file, connection, is_completed=False)
        # else:
        #     print(f"⚠️  ملف الفواتير المفتوحة غير موجود: {invoices_open_file}")
        # 
        # if os.path.exists(invoices_completed_file):
        #     import_invoices(invoices_completed_file, connection, is_completed=True)
        # else:
        #     print(f"⚠️  ملف الفواتير المنتهية غير موجود: {invoices_completed_file}")
        
        print("\n" + "=" * 60)
        print("✅ اكتمل استيراد البيانات بنجاح!")
        print("=" * 60)
        
    except Error as e:
        print(f"\n❌ خطأ في الاتصال بقاعدة البيانات: {e}")
        sys.exit(1)
    finally:
        if connection and connection.is_connected():
            connection.close()
            print("\n🔌 تم إغلاق الاتصال بقاعدة البيانات")


if __name__ == '__main__':
    main()

