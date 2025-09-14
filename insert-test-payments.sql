USE FZ;

-- إضافة عميل تجريبي
INSERT IGNORE INTO Customer (id, firstName, lastName, phone, email, address, cityId, companyId, createdBy, createdAt, updatedAt)
VALUES (1, 'عميل', 'تجريبي', '01234567890', 'test@example.com', 'عنوان تجريبي', 1, 1, 1, NOW(), NOW());

-- إضافة فاتورة تجريبية
INSERT IGNORE INTO Invoice (id, invoiceNumber, customerId, totalAmount, finalAmount, issueDate, dueDate, status, createdBy, createdAt, updatedAt)
VALUES (1, 'INV-001', 1, 1000.00, 1000.00, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'draft', 1, NOW(), NOW());

-- إضافة مدفوعات تجريبية
INSERT IGNORE INTO Payment (id, invoiceId, amount, currency, paymentMethod, paymentDate, referenceNumber, notes, createdBy, createdAt, updatedAt)
VALUES 
(1, 1, 500.00, 'EGP', 'cash', CURDATE(), 'REF-001', 'دفعة تجريبية 1', 1, NOW(), NOW()),
(2, 1, 300.00, 'EGP', 'card', CURDATE(), 'REF-002', 'دفعة تجريبية 2', 1, NOW(), NOW()),
(3, 1, 200.00, 'EGP', 'bank_transfer', CURDATE(), 'REF-003', 'دفعة تجريبية 3', 1, NOW(), NOW());

