-- التحقق من بيانات الشركات الموجودة
USE FZ;

-- عرض جميع الشركات
SELECT 'All companies in database:' as message;
SELECT id, name, email, phone, address, website, industry, description, status, taxNumber, customFields, createdAt, updatedAt, deletedAt 
FROM Company 
ORDER BY id;

-- عرض عدد الشركات
SELECT 'Total companies count:' as message;
SELECT COUNT(*) as totalCompanies FROM Company WHERE deletedAt IS NULL;

-- عرض الشركات مع العملاء المرتبطين
SELECT 'Companies with customers:' as message;
SELECT 
    c.id, c.name, c.email, c.phone, c.website, c.industry, c.status,
    COUNT(cust.id) as customersCount
FROM Company c
LEFT JOIN Customer cust ON c.id = cust.companyId AND cust.deletedAt IS NULL
WHERE c.deletedAt IS NULL
GROUP BY c.id
ORDER BY c.createdAt DESC;

-- عرض العملاء المرتبطين بالشركات
SELECT 'Customers linked to companies:' as message;
SELECT 
    cust.id, cust.name, cust.phone, cust.email, cust.address,
    c.name as companyName, c.industry as companyIndustry
FROM Customer cust
LEFT JOIN Company c ON cust.companyId = c.id
WHERE cust.deletedAt IS NULL AND cust.companyId IS NOT NULL
ORDER BY cust.createdAt DESC;
