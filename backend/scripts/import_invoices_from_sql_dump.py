#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
سكربت استيراد الفواتير من SQL Dump للنظام القديم
يقوم بإنشاء:
1. Device (الأجهزة)
2. RepairRequest (طلبات الإصلاح)
3. Invoice (الفواتير)
"""

import re
import json
import os
import sys
from datetime import datetime
from decimal import Decimal
from typing import Dict, Optional, Tuple, List

try:
    import mysql.connector
    from mysql.connector import Error
except ImportError:
    print("❌ mysql-connector-python غير مثبت!")
    print("📦 يرجى تثبيته باستخدام: pip3 install mysql-connector-python")
    sys.exit(1)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'FZ'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

SQL_DUMP_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    'IN',
    'FZ Data From Old System 2025-11-25_u539485933_maintain_dump.sql'
)


def import_sql_dump_to_temp_db(sql_file: str) -> bool:
    """استيراد SQL dump إلى قاعدة بيانات مؤقتة باستخدام mysql command"""
    import subprocess
    
    print(f"📖 جاري استيراد SQL dump إلى قاعدة بيانات مؤقتة...")
    
    if not os.path.exists(sql_file):
        print(f"❌ الملف غير موجود: {sql_file}")
        return False
    
    try:
        # إنشاء قاعدة بيانات مؤقتة
        print("  📦 إنشاء قاعدة بيانات مؤقتة...")
        mysql_cmd = f"/opt/lampp/bin/mysql -u {DB_CONFIG['user']}"
        if DB_CONFIG['password']:
            mysql_cmd += f" -p{DB_CONFIG['password']}"
        mysql_cmd += f" -e \"DROP DATABASE IF EXISTS temp_import_db; CREATE DATABASE temp_import_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\""
        
        result = subprocess.run(mysql_cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode != 0 and 'Access denied' not in result.stderr:
            print(f"⚠️  تحذير: {result.stderr[:200]}")
        
        # استيراد ملف SQL
        print("  📖 استيراد ملف SQL dump...")
        mysql_cmd = f"/opt/lampp/bin/mysql -u {DB_CONFIG['user']}"
        if DB_CONFIG['password']:
            mysql_cmd += f" -p{DB_CONFIG['password']}"
        mysql_cmd += " temp_import_db"
        
        with open(sql_file, 'r', encoding='utf-8') as f:
            result = subprocess.run(
                mysql_cmd,
                shell=True,
                stdin=f,
                capture_output=True,
                text=True,
                check=False
            )
        
        if result.returncode == 0:
            print("✅ تم استيراد SQL dump بنجاح")
            return True
        else:
            # في بعض الأحيان يعود خطأ لكن البيانات تم استيرادها
            if 'Table' in result.stderr and 'doesn\'t exist' not in result.stderr:
                print("✅ تم استيراد SQL dump (مع بعض التحذيرات)")
                return True
            else:
                print(f"⚠️  تحذير في استيراد SQL dump: {result.stderr[:300]}")
                # نحاول المتابعة على أي حال
                return True
        
    except Exception as e:
        print(f"❌ خطأ في استيراد SQL dump: {e}")
        return False


def read_invoices_from_temp_db(connection) -> List[Dict]:
    """قراءة بيانات الفواتير من قاعدة البيانات المؤقتة"""
    print("📖 جاري قراءة بيانات الفواتير...")
    
    invoices = []
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("USE temp_import_db")
        cursor.execute("SELECT * FROM invoices ORDER BY id")
        
        rows = cursor.fetchall()
        
        for row in rows:
            invoice = {
                'id': row.get('id'),
                'payment': row.get('payment'),
                'device_type': row.get('device_type'),
                'brand': row.get('brand'),
                'device_model': row.get('device_model'),
                'device_sn': row.get('device_sn'),
                'purchase_date': row.get('purchase_date'),
                'problem_description': row.get('problem_description'),
                'accessories': row.get('accessories'),
                'specifcations': row.get('specifcations'),
                'examination': row.get('examination'),
                'date': row.get('date'),
                'entery_at': row.get('entery_at'),
                'exit_at': row.get('exit_at'),
                'client_id': row.get('client_id'),
                'total': float(row.get('total', 0)) if row.get('total') else 0.0,
                'paid': float(row.get('paid', 0)) if row.get('paid') else 0.0,
                'due': float(row.get('due', 0)) if row.get('due') else 0.0,
                'note': row.get('note'),
                'branche_id': row.get('branche_id'),
                'creator_id': row.get('creator_id'),
                'status_id': row.get('status_id'),
            }
            invoices.append(invoice)
        
        print(f"✅ تم قراءة {len(invoices)} فاتورة")
        return invoices
        
    except Exception as e:
        print(f"❌ خطأ في قراءة البيانات: {e}")
        return []
    finally:
        cursor.close()


def parse_json_field(value: str) -> Optional[Dict]:
    """تحليل حقل JSON"""
    if not value or value == 'NULL':
        return None
    
    try:
        # إزالة الـ backslashes
        value = value.replace('\\"', '"').replace("\\'", "'")
        return json.loads(value)
    except:
        return None


def parse_date(date_str: str) -> Optional[datetime]:
    """تحليل التاريخ"""
    if not date_str or date_str == 'NULL':
        return None
    
    try:
        # تنسيقات التاريخ المحتملة
        formats = [
            '%Y-%m-%d',
            '%Y-%m-%d %H:%M:%S',
            '%Y-%m-%d %H:%M:%S.%f',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except:
                continue
        
        return None
    except:
        return None


def map_old_status_to_new(connection, old_status_id: Optional[int]) -> str:
    """تحويل حالة الفاتورة القديمة إلى الجديدة"""
    if not old_status_id:
        return 'RECEIVED'
    
    temp_cursor = connection.cursor()
    try:
        # قراءة الحالة من قاعدة البيانات المؤقتة
        temp_cursor.execute("USE temp_import_db")
        temp_cursor.execute(
            "SELECT name FROM status WHERE id = %s LIMIT 1",
            (old_status_id,)
        )
        status_row = temp_cursor.fetchone()
        
        if not status_row:
            return 'RECEIVED'
        
        status_name = status_row[0]
        
        # تحويل الحالة من العربي إلى الإنجليزي
        status_map = {
            'تم الاستلام من العميل': 'RECEIVED',
            'تم التسليم للمهندس وجارى الفحص': 'INSPECTION',
            'تم الاصلاح وجاهز للاستلام ✨': 'READY_FOR_DELIVERY',
            'بانتظار قطع غيار': 'WAITING_PARTS',
            'مرفوض': 'REJECTED',
            'تم تسليم الجهاز للعميل?✨': 'DELIVERED',
            'صيانه خارحيه': 'ON_HOLD',
            'تحت الاختبارت النهائيه...': 'INSPECTION',
        }
        
        return status_map.get(status_name, 'RECEIVED')
        
    except Exception as e:
        print(f"⚠️  خطأ في قراءة الحالة {old_status_id}: {e}")
        return 'RECEIVED'
    finally:
        temp_cursor.close()


def connect_db():
    """الاتصال بقاعدة البيانات"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            print(f"✅ تم الاتصال بقاعدة البيانات: {DB_CONFIG['database']}")
            return connection
    except Error as e:
        print(f"❌ خطأ في الاتصال بقاعدة البيانات: {e}")
        return None


def get_customer_by_old_id(connection, old_client_id: int) -> Optional[int]:
    """الحصول على ID العميل الجديد من ID القديم"""
    cursor = connection.cursor()
    try:
        # أولاً: البحث في قاعدة البيانات المؤقتة للحصول على اسم العميل
        cursor.execute("USE temp_import_db")
        cursor.execute(
            "SELECT name, mobile FROM clients WHERE id = %s LIMIT 1",
            (old_client_id,)
        )
        old_client = cursor.fetchone()
        
        if not old_client:
            return None
        
        client_name = old_client[0]
        client_phone = old_client[1] if len(old_client) > 1 else None
        
        # البحث في قاعدة البيانات الجديدة باستخدام الاسم والهاتف
        cursor.execute("USE FZ")
        
        # البحث بالاسم
        cursor.execute(
            """SELECT id FROM Customer 
               WHERE name = %s AND deletedAt IS NULL 
               LIMIT 1""",
            (client_name,)
        )
        result = cursor.fetchone()
        
        if result:
            return result[0]
        
        # إذا لم يتم العثور، البحث بالهاتف
        if client_phone and client_phone != '.':
            cursor.execute(
                """SELECT id FROM Customer 
                   WHERE phone = %s AND deletedAt IS NULL 
                   LIMIT 1""",
                (client_phone,)
            )
            result = cursor.fetchone()
            if result:
                return result[0]
        
        return None
        
    except Exception as e:
        print(f"⚠️  خطأ في البحث عن العميل {old_client_id}: {e}")
        return None
    finally:
        cursor.close()


def get_branch_by_old_id(connection, old_branch_id: int) -> Optional[int]:
    """الحصول على ID الفرع الجديد من ID القديم"""
    cursor = connection.cursor()
    try:
        # البحث في قاعدة البيانات المؤقتة للحصول على اسم الفرع
        cursor.execute("USE temp_import_db")
        cursor.execute(
            "SELECT name FROM branches WHERE id = %s LIMIT 1",
            (old_branch_id,)
        )
        old_branch = cursor.fetchone()
        
        if not old_branch:
            return None
        
        branch_name = old_branch[0]
        
        # البحث في قاعدة البيانات الجديدة
        cursor.execute("USE FZ")
        cursor.execute(
            "SELECT id FROM Branch WHERE name = %s LIMIT 1",
            (branch_name,)
        )
        result = cursor.fetchone()
        
        return result[0] if result else None
        
    except:
        return None
    finally:
        cursor.close()


def create_device(connection, invoice_data: Dict, customer_id: int) -> Optional[int]:
    """إنشاء جهاز جديد"""
    cursor = connection.cursor()
    
    try:
        # تحليل specifications
        specs = parse_json_field(invoice_data.get('specifcations'))
        
        # استخراج CPU, GPU, RAM, Storage من specifications
        cpu = None
        gpu = None
        ram = None
        storage = None
        
        if specs:
            cpu = (specs.get('CPU') or '')[:100] if specs.get('CPU') else None
            gpu = (specs.get('GPU') or '')[:100] if specs.get('GPU') else None
            ram = (specs.get('RAM') or '')[:50] if specs.get('RAM') else None
            storage = (specs.get('Storage') or '')[:50] if specs.get('Storage') else None
        
        # إنشاء customFields
        custom_fields = {
            'oldInvoiceId': invoice_data.get('id'),
            'purchaseDate': invoice_data.get('purchase_date'),
            'accessories': parse_json_field(invoice_data.get('accessories')),
            'examination': parse_json_field(invoice_data.get('examination')),
        }
        
        cursor.execute(
            """INSERT INTO Device 
               (customerId, deviceType, brand, model, serialNumber, cpu, gpu, ram, storage, customFields, createdAt)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
            (
                customer_id,
                invoice_data.get('device_type'),
                invoice_data.get('brand'),
                invoice_data.get('device_model'),
                invoice_data.get('device_sn'),
                cpu,
                gpu,
                ram,
                storage,
                json.dumps(custom_fields, ensure_ascii=False)
            )
        )
        
        device_id = cursor.lastrowid
        connection.commit()
        return device_id
        
    except Error as e:
        print(f"❌ خطأ في إنشاء الجهاز: {e}")
        connection.rollback()
        return None
    finally:
        cursor.close()


def create_repair_request(connection, invoice_data: Dict, customer_id: int, device_id: int, branch_id: Optional[int]) -> Optional[int]:
    """إنشاء طلب إصلاح"""
    cursor = connection.cursor()
    
    try:
        # تحويل التاريخ
        received_date = parse_date(invoice_data.get('entery_at')) or parse_date(invoice_data.get('date'))
        exit_date = parse_date(invoice_data.get('exit_at'))
        
        # تحويل الحالة - قراءة آخر حالة من invoice_status
        status_id = invoice_data.get('status_id')
        # البحث عن آخر حالة في invoice_status من قاعدة البيانات المؤقتة
        temp_cursor = connection.cursor()
        try:
            temp_cursor.execute("USE temp_import_db")
            temp_cursor.execute(
                """SELECT status_id FROM invoice_status 
                   WHERE invoice_id = %s 
                   ORDER BY created_at DESC, id DESC 
                   LIMIT 1""",
                (invoice_data.get('id'),)
            )
            last_status_row = temp_cursor.fetchone()
            if last_status_row:
                status_id = last_status_row[0]
        finally:
            temp_cursor.close()
        
        # تحويل الحالة
        status = map_old_status_to_new(connection, status_id)
        
        # إنشاء customFields
        custom_fields = {
            'oldInvoiceId': invoice_data.get('id'),
            'oldStatusId': invoice_data.get('status_id'),
            'oldBranchId': invoice_data.get('branche_id'),
            'oldCreatorId': invoice_data.get('creator_id'),
        }
        
        # إعداد وصف المشكلة مع إضافة رقم الفاتورة القديمة في النهاية
        problem_description = invoice_data.get('problem_description') or ''
        old_invoice_id = invoice_data.get('id')
        if old_invoice_id:
            problem_description += f"\n\n(الرقم القديم للفاتورة: {old_invoice_id})"
        
        # التأكد من أننا نستخدم قاعدة البيانات الرئيسية
        cursor.execute("USE FZ")
        cursor.execute(
            """INSERT INTO RepairRequest 
               (deviceId, customerId, branchId, reportedProblem, status, customFields, createdAt, updatedAt)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                device_id,
                customer_id,
                branch_id,
                problem_description,
                status,
                json.dumps(custom_fields, ensure_ascii=False),
                received_date or datetime.now(),
                datetime.now()
            )
        )
        
        repair_request_id = cursor.lastrowid
        connection.commit()
        return repair_request_id
        
    except Error as e:
        print(f"❌ خطأ في إنشاء طلب الإصلاح: {e}")
        connection.rollback()
        return None
    finally:
        cursor.close()


def create_invoice(connection, invoice_data: Dict, repair_request_id: int) -> Optional[int]:
    """إنشاء فاتورة"""
    cursor = connection.cursor()
    
    try:
        invoice_date = parse_date(invoice_data.get('date')) or datetime.now()
        
        # حساب الحالة
        total = Decimal(str(invoice_data.get('total', 0)))
        paid = Decimal(str(invoice_data.get('paid', 0)))
        
        if paid >= total:
            status = 'PAID'
        elif paid > 0:
            status = 'PARTIAL'
        else:
            status = 'UNPAID'
        
        cursor.execute("USE FZ")
        cursor.execute(
            """INSERT INTO Invoice 
               (repairRequestId, totalAmount, amountPaid, status, currency, notes, createdAt, updatedAt)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (
                repair_request_id,
                total,
                paid,
                status,
                'EGP',
                invoice_data.get('note'),
                invoice_date,
                datetime.now()
            )
        )
        
        invoice_id = cursor.lastrowid
        connection.commit()
        return invoice_id
        
    except Error as e:
        print(f"❌ خطأ في إنشاء الفاتورة: {e}")
        connection.rollback()
        return None
    finally:
        cursor.close()


def create_invoice_items_from_old_services(connection, old_invoice_id: int, new_invoice_id: int) -> int:
    """إنشاء عناصر الفاتورة من الخدمات القديمة"""
    cursor = connection.cursor()
    items_created = 0
    
    try:
        # قراءة الخدمات من قاعدة البيانات المؤقتة
        temp_cursor = connection.cursor(dictionary=True)
        temp_cursor.execute("USE temp_import_db")
        temp_cursor.execute(
            """SELECT title, price 
               FROM invoice_services 
               WHERE invoice_id = %s
               ORDER BY id""",
            (old_invoice_id,)
        )
        services = temp_cursor.fetchall()
        temp_cursor.close()
        
        if not services:
            return 0
        
        # إنشاء عناصر الفاتورة
        cursor.execute("USE FZ")
        for service in services:
            service_title_raw = service.get('title')
            service_title = (service_title_raw or '').strip()
            service_price = float(service.get('price') or 0)
            
            if not service_title:
                continue
            
            try:
                # إنشاء InvoiceItem كخدمة نصية (serviceId = NULL)
                cursor.execute(
                    """INSERT INTO InvoiceItem 
                       (invoiceId, description, quantity, unitPrice, totalPrice, itemType, serviceId, createdAt, updatedAt)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())""",
                    (
                        new_invoice_id,
                        service_title,
                        1,  # quantity = 1
                        service_price,
                        service_price,  # totalPrice = quantity * unitPrice
                        'service',
                        None,  # serviceId = NULL لأنها خدمة نصية غير محفوظة
                    )
                )
                items_created += 1
            except Error as e:
                print(f"  ⚠️  خطأ في إنشاء عنصر الخدمة '{service_title}': {e}")
                continue
        
        connection.commit()
        return items_created
        
    except Error as e:
        print(f"❌ خطأ في إنشاء عناصر الفاتورة: {e}")
        connection.rollback()
        return items_created
    finally:
        cursor.close()


def main():
    """الدالة الرئيسية"""
    print("=" * 60)
    print("🚀 بدء استيراد الفواتير من SQL Dump")
    print("=" * 60)
    
    # استيراد SQL dump إلى قاعدة بيانات مؤقتة
    if not import_sql_dump_to_temp_db(SQL_DUMP_FILE):
        return
    
    # الاتصال بقاعدة البيانات
    connection = connect_db()
    if not connection:
        return
    
    # قراءة البيانات من قاعدة البيانات المؤقتة
    invoices = read_invoices_from_temp_db(connection)
    
    if not invoices:
        print("❌ لم يتم العثور على بيانات للاستيراد")
        # حذف قاعدة البيانات المؤقتة
        try:
            cursor = connection.cursor()
            cursor.execute("DROP DATABASE IF EXISTS temp_import_db")
            cursor.close()
        except:
            pass
        connection.close()
        return
    
    print(f"\n📊 جاري استيراد {len(invoices)} فاتورة...\n")
    
    devices_created = 0
    repair_requests_created = 0
    invoices_created = 0
    errors = 0
    
    for idx, invoice_data in enumerate(invoices, 1):
        try:
            # الحصول على customer_id الجديد
            old_client_id = invoice_data.get('client_id')
            if not old_client_id:
                print(f"⚠️  الفاتورة {idx}: لا يوجد client_id")
                errors += 1
                continue
            
            customer_id = get_customer_by_old_id(connection, old_client_id)
            if not customer_id:
                print(f"⚠️  الفاتورة {idx}: لم يتم العثور على العميل {old_client_id}")
                errors += 1
                continue
            
            # الحصول على branch_id الجديد
            old_branch_id = invoice_data.get('branche_id')
            branch_id = get_branch_by_old_id(connection, old_branch_id) if old_branch_id else None
            
            # إنشاء Device
            device_id = create_device(connection, invoice_data, customer_id)
            if not device_id:
                print(f"⚠️  الفاتورة {idx}: فشل إنشاء الجهاز")
                errors += 1
                continue
            
            devices_created += 1
            
            # إنشاء RepairRequest
            repair_request_id = create_repair_request(connection, invoice_data, customer_id, device_id, branch_id)
            if not repair_request_id:
                print(f"⚠️  الفاتورة {idx}: فشل إنشاء طلب الإصلاح")
                errors += 1
                continue
            
            repair_requests_created += 1
            
            # إنشاء Invoice
            invoice_id = create_invoice(connection, invoice_data, repair_request_id)
            if not invoice_id:
                print(f"⚠️  الفاتورة {idx}: فشل إنشاء الفاتورة")
                errors += 1
                continue
            
            invoices_created += 1
            
            # إضافة عناصر الفاتورة من الخدمات القديمة
            old_invoice_id = invoice_data.get('id')
            if old_invoice_id:
                items_count = create_invoice_items_from_old_services(connection, old_invoice_id, invoice_id)
                if items_count > 0 and idx % 100 == 0:
                    print(f"  ✅ تم إضافة {items_count} خدمة للفاتورة {idx}")
            
            if idx % 50 == 0:
                print(f"  ✅ تم معالجة {idx} فاتورة...")
                
        except Exception as e:
            print(f"❌ خطأ في معالجة الفاتورة {idx}: {e}")
            errors += 1
            continue
    
    print("\n" + "=" * 60)
    print("📊 ملخص الاستيراد:")
    print(f"  ✅ الأجهزة: {devices_created}")
    print(f"  ✅ طلبات الإصلاح: {repair_requests_created}")
    print(f"  ✅ الفواتير: {invoices_created}")
    if errors > 0:
        print(f"  ❌ الأخطاء: {errors}")
    print("=" * 60)
    
    # حذف قاعدة البيانات المؤقتة
    try:
        cursor = connection.cursor()
        cursor.execute("DROP DATABASE IF EXISTS temp_import_db")
        cursor.close()
        print("🗑️  تم حذف قاعدة البيانات المؤقتة")
    except:
        pass
    
    connection.close()
    print("\n✅ اكتمل الاستيراد!")


if __name__ == '__main__':
    main()

