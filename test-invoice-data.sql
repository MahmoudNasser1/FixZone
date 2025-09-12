-- إنشاء فاتورة تجريبية لاختبار النظام
INSERT INTO Invoice (totalAmount, amountPaid, status, repairRequestId, currency, taxAmount) 
VALUES (500.00, 0.00, 'unpaid', 1, 'SAR', 75.00);

-- إنشاء عنصر فاتورة تجريبي
INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) 
VALUES (1, 425.00, 425.00, LAST_INSERT_ID(), 'إصلاح شاشة الهاتف', 'service');

-- إنشاء عنصر فاتورة تجريبي آخر
INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) 
VALUES (1, 75.00, 75.00, LAST_INSERT_ID(), 'ضريبة القيمة المضافة', 'service');

-- إنشاء فاتورة أخرى مدفوعة جزئياً
INSERT INTO Invoice (totalAmount, amountPaid, status, repairRequestId, currency, taxAmount) 
VALUES (300.00, 150.00, 'partial', 2, 'SAR', 45.00);

-- إنشاء عناصر الفاتورة الثانية
INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) 
VALUES (1, 255.00, 255.00, LAST_INSERT_ID(), 'استبدال البطارية', 'part');

INSERT INTO InvoiceItem (quantity, unitPrice, totalPrice, invoiceId, description, itemType) 
VALUES (1, 45.00, 45.00, LAST_INSERT_ID(), 'ضريبة القيمة المضافة', 'service');
