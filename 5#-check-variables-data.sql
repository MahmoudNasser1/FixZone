-- فحص بيانات المتغيرات في قاعدة البيانات
USE FZ;

-- فحص VariableCategory
SELECT 'VariableCategory:' as table_name;
SELECT * FROM VariableCategory;

-- فحص VariableOption
SELECT 'VariableOption:' as table_name;
SELECT * FROM VariableOption;

-- فحص البيانات حسب الفئة
SELECT 'BRAND Options:' as category;
SELECT vo.*, vc.name as category_name 
FROM VariableOption vo 
JOIN VariableCategory vc ON vo.categoryId = vc.id 
WHERE vc.code = 'BRAND';

SELECT 'ACCESSORY Options:' as category;
SELECT vo.*, vc.name as category_name 
FROM VariableOption vo 
JOIN VariableCategory vc ON vo.categoryId = vc.id 
WHERE vc.code = 'ACCESSORY';

SELECT 'DEVICE_TYPE Options:' as category;
SELECT vo.*, vc.name as category_name 
FROM VariableOption vo 
JOIN VariableCategory vc ON vo.categoryId = vc.id 
WHERE vc.code = 'DEVICE_TYPE';
