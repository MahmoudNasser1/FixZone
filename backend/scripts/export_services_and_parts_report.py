#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
سكربت لاستخراج تقرير عن الخدمات وقطع الغيار والإصلاحات من قاعدة البيانات القديمة
يستخرج:
1. الخدمات (Services) من invoice_services
2. قطع الغيار (Parts) من invoices (JSON fields)
3. الإصلاحات (Repairs) من invoices
"""

import os
import sys
import json
import csv
from datetime import datetime
from typing import Dict, List, Set
from collections import defaultdict

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
    'database': 'temp_import_db',  # قاعدة البيانات المؤقتة
    'port': int(os.getenv('DB_PORT', 3306)),
    'charset': 'utf8mb4',
    'collation': 'utf8mb4_unicode_ci'
}

SQL_DUMP_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    'IN',
    'FZ Data From Old System 2025-11-25_u539485933_maintain_dump.sql'
)

OUTPUT_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    'IN',
    'EXPORT_REPORTS'
)


def ensure_temp_db_imported():
    """التأكد من استيراد قاعدة البيانات المؤقتة"""
    import subprocess
    
    print("📖 التحقق من قاعدة البيانات المؤقتة...")
    
    connection = None
    try:
        connection = mysql.connector.connect(
            host=DB_CONFIG['host'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            port=DB_CONFIG['port']
        )
        
        cursor = connection.cursor()
        cursor.execute("SHOW DATABASES LIKE 'temp_import_db'")
        result = cursor.fetchone()
        
        if not result:
            print("  📦 قاعدة البيانات المؤقتة غير موجودة، جاري الاستيراد...")
            cursor.execute("CREATE DATABASE temp_import_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            cursor.execute("USE temp_import_db")
            
            # استيراد SQL dump
            mysql_cmd = f"/opt/lampp/bin/mysql -u {DB_CONFIG['user']}"
            if DB_CONFIG['password']:
                mysql_cmd += f" -p{DB_CONFIG['password']}"
            mysql_cmd += " temp_import_db"
            
            with open(SQL_DUMP_FILE, 'r', encoding='utf-8') as f:
                subprocess.run(mysql_cmd, shell=True, stdin=f, capture_output=True, text=True, check=False)
            
            print("  ✅ تم استيراد قاعدة البيانات المؤقتة")
        else:
            print("  ✅ قاعدة البيانات المؤقتة موجودة")
        
        cursor.close()
        return True
        
    except Exception as e:
        print(f"❌ خطأ في التحقق من قاعدة البيانات: {e}")
        return False
    finally:
        if connection and connection.is_connected():
            connection.close()


def parse_json_field(value: str) -> Dict:
    """تحليل حقل JSON"""
    if not value or value == 'NULL' or value == 'null':
        return {}
    
    try:
        # إزالة backslashes
        value = value.replace('\\"', '"').replace("\\'", "'")
        return json.loads(value)
    except:
        return {}


def export_services():
    """تصدير الخدمات من invoice_services"""
    print("\n📋 جاري تصدير الخدمات...")
    
    connection = mysql.connector.connect(
        host=DB_CONFIG['host'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        database=DB_CONFIG['database'],
        port=DB_CONFIG['port']
    )
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # قراءة جميع الخدمات
        cursor.execute("""
            SELECT 
                isv.id,
                isv.title as service_name,
                isv.price as service_price,
                isv.invoice_id,
                isv.created_at,
                i.date as invoice_date,
                i.client_id,
                c.name as client_name
            FROM invoice_services isv
            LEFT JOIN invoices i ON isv.invoice_id = i.id
            LEFT JOIN clients c ON i.client_id = c.id
            ORDER BY isv.id
        """)
        
        services = cursor.fetchall()
        print(f"  ✅ تم العثور على {len(services)} خدمة")
        
        # تجميع الخدمات الفريدة
        unique_services = {}
        service_stats = defaultdict(lambda: {'count': 0, 'total_revenue': 0, 'min_price': float('inf'), 'max_price': 0})
        
        for service in services:
            service_name = (service.get('service_name') or '').strip()
            if not service_name:
                continue
            
            price = float(service.get('service_price') or 0)
            
            if service_name not in unique_services:
                unique_services[service_name] = {
                    'service_name': service_name,
                    'first_seen_date': service.get('invoice_date'),
                    'first_invoice_id': service.get('invoice_id'),
                    'count': 0,
                    'total_revenue': 0,
                    'prices': []
                }
            
            unique_services[service_name]['count'] += 1
            unique_services[service_name]['total_revenue'] += price
            unique_services[service_name]['prices'].append(price)
        
        # حساب الإحصائيات
        for name, data in unique_services.items():
            data['avg_price'] = data['total_revenue'] / data['count'] if data['count'] > 0 else 0
            data['min_price'] = min(data['prices']) if data['prices'] else 0
            data['max_price'] = max(data['prices']) if data['prices'] else 0
            del data['prices']  # حذف قائمة الأسعار
        
        # حفظ التقرير
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        services_file = os.path.join(OUTPUT_DIR, 'services_report.csv')
        
        with open(services_file, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'service_name', 'count', 'total_revenue', 'avg_price', 
                'min_price', 'max_price', 'first_seen_date', 'first_invoice_id'
            ])
            writer.writeheader()
            
            for service_data in sorted(unique_services.values(), key=lambda x: x['count'], reverse=True):
                writer.writerow({
                    'service_name': service_data['service_name'],
                    'count': service_data['count'],
                    'total_revenue': f"{service_data['total_revenue']:.2f}",
                    'avg_price': f"{service_data['avg_price']:.2f}",
                    'min_price': f"{service_data['min_price']:.2f}",
                    'max_price': f"{service_data['max_price']:.2f}",
                    'first_seen_date': service_data['first_seen_date'],
                    'first_invoice_id': service_data['first_invoice_id']
                })
        
        print(f"  ✅ تم حفظ {len(unique_services)} خدمة فريدة في: {services_file}")
        
        # حفظ التفاصيل الكاملة
        services_details_file = os.path.join(OUTPUT_DIR, 'services_details.csv')
        with open(services_details_file, 'w', encoding='utf-8-sig', newline='') as f:
            if services:
                writer = csv.DictWriter(f, fieldnames=services[0].keys())
                writer.writeheader()
                writer.writerows(services)
        
        print(f"  ✅ تم حفظ التفاصيل الكاملة في: {services_details_file}")
        
        return unique_services
        
    except Exception as e:
        print(f"❌ خطأ في تصدير الخدمات: {e}")
        import traceback
        traceback.print_exc()
        return {}
    finally:
        cursor.close()
        connection.close()


def export_parts_from_products():
    """تصدير قطع الغيار من جدول products"""
    print("\n🔧 جاري تصدير قطع الغيار من جدول products...")
    
    connection = mysql.connector.connect(
        host=DB_CONFIG['host'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        database=DB_CONFIG['database'],
        port=DB_CONFIG['port']
    )
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # قراءة جميع المنتجات (قطع الغيار)
        cursor.execute("""
            SELECT 
                id,
                name,
                code,
                type,
                cost,
                price,
                price2,
                description,
                model,
                category_id,
                created_at,
                updated_at,
                deleted_at
            FROM products
            WHERE deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00'
            ORDER BY id
        """)
        
        products = cursor.fetchall()
        print(f"  ✅ تم العثور على {len(products)} قطعة غيار في جدول products")
        
        # حفظ التقرير
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        products_file = os.path.join(OUTPUT_DIR, 'parts_from_products.csv')
        
        with open(products_file, 'w', encoding='utf-8-sig', newline='') as f:
            if products:
                writer = csv.DictWriter(f, fieldnames=products[0].keys())
                writer.writeheader()
                writer.writerows(products)
        
        print(f"  ✅ تم حفظ {len(products)} قطعة غيار في: {products_file}")
        
        return products
        
    except Exception as e:
        print(f"❌ خطأ في تصدير قطع الغيار من products: {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        cursor.close()
        connection.close()


def export_parts_from_invoices():
    """تصدير قطع الغيار من حقل accessories في invoices"""
    print("\n🔧 جاري تصدير قطع الغيار من invoices (accessories)...")
    
    connection = mysql.connector.connect(
        host=DB_CONFIG['host'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        database=DB_CONFIG['database'],
        port=DB_CONFIG['port']
    )
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # قراءة جميع الفواتير
        cursor.execute("""
            SELECT 
                id as invoice_id,
                accessories,
                specifcations,
                date as invoice_date,
                client_id,
                total,
                problem_description
            FROM invoices
            WHERE accessories IS NOT NULL OR specifcations IS NOT NULL
        """)
        
        invoices = cursor.fetchall()
        print(f"  ✅ تم العثور على {len(invoices)} فاتورة تحتوي على معلومات قطع غيار")
        
        parts_list = []
        unique_parts = defaultdict(lambda: {'count': 0, 'invoices': []})
        
        for invoice in invoices:
            invoice_id = invoice.get('invoice_id')
            accessories = parse_json_field(invoice.get('accessories') or '')
            specifications = parse_json_field(invoice.get('specifcations') or '')
            
            # استخراج قطع الغيار من accessories
            if isinstance(accessories, dict):
                for key, value in accessories.items():
                    if value:
                        part_name = str(key).strip()
                        part_info = str(value).strip()
                        
                        if part_name and part_info:
                            unique_parts[part_name]['count'] += 1
                            unique_parts[part_name]['invoices'].append(invoice_id)
                            
                            parts_list.append({
                                'invoice_id': invoice_id,
                                'invoice_date': invoice.get('invoice_date'),
                                'part_name': part_name,
                                'part_info': part_info,
                                'source': 'accessories'
                            })
            
            # استخراج مواصفات الجهاز (قد تحتوي على معلومات قطع غيار)
            if isinstance(specifications, dict):
                for key, value in specifications.items():
                    if key and value and key.lower() not in ['cpu', 'gpu', 'ram', 'storage']:
                        part_name = key
                        part_info = str(value)
                        
                        unique_parts[part_name]['count'] += 1
                        unique_parts[part_name]['invoices'].append(invoice_id)
                        
                        parts_list.append({
                            'invoice_id': invoice_id,
                            'invoice_date': invoice.get('invoice_date'),
                            'part_name': part_name,
                            'part_info': part_info,
                            'source': 'specifications'
                        })
        
        # حفظ التقرير
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        parts_file = os.path.join(OUTPUT_DIR, 'parts_from_invoices_report.csv')
        
        with open(parts_file, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=[
                'part_name', 'count', 'invoice_ids'
            ])
            writer.writeheader()
            
            for part_name, data in sorted(unique_parts.items(), key=lambda x: x[1]['count'], reverse=True):
                invoice_ids = ','.join(map(str, set(data['invoices'][:100])))  # أول 100 فاتورة
                writer.writerow({
                    'part_name': part_name,
                    'count': data['count'],
                    'invoice_ids': invoice_ids
                })
        
        print(f"  ✅ تم حفظ {len(unique_parts)} قطعة غيار فريدة في: {parts_file}")
        
        # حفظ التفاصيل الكاملة
        parts_details_file = os.path.join(OUTPUT_DIR, 'parts_from_invoices_details.csv')
        with open(parts_details_file, 'w', encoding='utf-8-sig', newline='') as f:
            if parts_list:
                writer = csv.DictWriter(f, fieldnames=parts_list[0].keys())
                writer.writeheader()
                writer.writerows(parts_list)
        
        print(f"  ✅ تم حفظ التفاصيل الكاملة في: {parts_details_file}")
        
        return unique_parts
        
    except Exception as e:
        print(f"❌ خطأ في تصدير قطع الغيار: {e}")
        import traceback
        traceback.print_exc()
        return {}
    finally:
        cursor.close()
        connection.close()


def export_repairs_summary():
    """تصدير ملخص الإصلاحات"""
    print("\n🔨 جاري تصدير ملخص الإصلاحات...")
    
    connection = mysql.connector.connect(
        host=DB_CONFIG['host'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        database=DB_CONFIG['database'],
        port=DB_CONFIG['port']
    )
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # قراءة جميع الفواتير (الإصلاحات)
        cursor.execute("""
            SELECT 
                i.id as invoice_id,
                i.date as invoice_date,
                i.entery_at,
                i.exit_at,
                i.problem_description,
                i.device_type,
                i.brand,
                i.device_model,
                i.total,
                i.paid,
                i.due,
                i.client_id,
                c.name as client_name,
                s.name as status_name
            FROM invoices i
            LEFT JOIN clients c ON i.client_id = c.id
            LEFT JOIN invoice_status ins ON i.id = ins.invoice_id
            LEFT JOIN status s ON ins.status_id = s.id
            WHERE i.id IS NOT NULL
            ORDER BY i.id
        """)
        
        repairs = cursor.fetchall()
        print(f"  ✅ تم العثور على {len(repairs)} إصلاح")
        
        # تجميع حسب نوع المشكلة
        problem_types = defaultdict(lambda: {'count': 0, 'invoices': []})
        device_types = defaultdict(int)
        brands = defaultdict(int)
        
        for repair in repairs:
            problem = (repair.get('problem_description') or '').strip()
            device_type = (repair.get('device_type') or '').strip()
            brand = (repair.get('brand') or '').strip()
            
            if problem:
                # استخراج الكلمات المفتاحية من المشكلة
                problem_keywords = problem.split()[:5]  # أول 5 كلمات
                problem_key = ' '.join(problem_keywords)
                problem_types[problem_key]['count'] += 1
                problem_types[problem_key]['invoices'].append(repair.get('invoice_id'))
            
            if device_type:
                device_types[device_type] += 1
            
            if brand:
                brands[brand] += 1
        
        # حفظ التقرير
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        # تقرير أنواع المشاكل
        problems_file = os.path.join(OUTPUT_DIR, 'repair_problems_report.csv')
        with open(problems_file, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['problem_description', 'count', 'invoice_ids'])
            writer.writeheader()
            
            for problem, data in sorted(problem_types.items(), key=lambda x: x[1]['count'], reverse=True):
                invoice_ids = ','.join(map(str, data['invoices'][:50]))  # أول 50 فاتورة
                writer.writerow({
                    'problem_description': problem,
                    'count': data['count'],
                    'invoice_ids': invoice_ids
                })
        
        print(f"  ✅ تم حفظ {len(problem_types)} نوع مشكلة في: {problems_file}")
        
        # تقرير أنواع الأجهزة
        devices_file = os.path.join(OUTPUT_DIR, 'device_types_report.csv')
        with open(devices_file, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['device_type', 'count'])
            writer.writeheader()
            for device_type, count in sorted(device_types.items(), key=lambda x: x[1], reverse=True):
                writer.writerow({'device_type': device_type, 'count': count})
        
        print(f"  ✅ تم حفظ {len(device_types)} نوع جهاز في: {devices_file}")
        
        # تقرير العلامات التجارية
        brands_file = os.path.join(OUTPUT_DIR, 'brands_report.csv')
        with open(brands_file, 'w', encoding='utf-8-sig', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=['brand', 'count'])
            writer.writeheader()
            for brand, count in sorted(brands.items(), key=lambda x: x[1], reverse=True):
                writer.writerow({'brand': brand, 'count': count})
        
        print(f"  ✅ تم حفظ {len(brands)} علامة تجارية في: {brands_file}")
        
        # حفظ التفاصيل الكاملة
        repairs_details_file = os.path.join(OUTPUT_DIR, 'repairs_details.csv')
        with open(repairs_details_file, 'w', encoding='utf-8-sig', newline='') as f:
            if repairs:
                writer = csv.DictWriter(f, fieldnames=repairs[0].keys())
                writer.writeheader()
                writer.writerows(repairs)
        
        print(f"  ✅ تم حفظ التفاصيل الكاملة في: {repairs_details_file}")
        
        return repairs
        
    except Exception as e:
        print(f"❌ خطأ في تصدير ملخص الإصلاحات: {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        cursor.close()
        connection.close()


def main():
    """الدالة الرئيسية"""
    print("=" * 60)
    print("🚀 بدء تصدير تقرير الخدمات وقطع الغيار والإصلاحات")
    print("=" * 60)
    
    # التأكد من استيراد قاعدة البيانات المؤقتة
    if not ensure_temp_db_imported():
        print("❌ فشل في استيراد قاعدة البيانات المؤقتة")
        return
    
    # تصدير الخدمات
    services = export_services()
    
    # تصدير قطع الغيار من جدول products
    products = export_parts_from_products()
    
    # تصدير قطع الغيار من invoices
    parts = export_parts_from_invoices()
    
    # تصدير ملخص الإصلاحات
    repairs = export_repairs_summary()
    
    # ملخص نهائي
    print("\n" + "=" * 60)
    print("📊 ملخص التصدير:")
    print(f"  ✅ الخدمات: {len(services)} خدمة فريدة")
    print(f"  ✅ قطع الغيار من products: {len(products)} قطعة")
    print(f"  ✅ قطع الغيار من invoices: {len(parts)} قطعة فريدة")
    print(f"  ✅ الإصلاحات: {len(repairs)} إصلاح")
    print(f"  📁 الملفات المحفوظة في: {OUTPUT_DIR}")
    print("=" * 60)
    print("\n✅ اكتمل التصدير!")


if __name__ == '__main__':
    main()

