-- إضافة بيانات تجريبية للشركات
INSERT INTO Company (
    name, email, phone, address, website, 
    industry, description, status, createdAt, updatedAt
) VALUES 
(
    'شركة التقنيات المتقدمة',
    'info@advanced-tech.com',
    '0112345678',
    'الرياض، حي العليا، شارع الملك فهد',
    'www.advanced-tech.com',
    'تقنية المعلومات',
    'شركة متخصصة في حلول تقنية المعلومات والبرمجيات',
    'active',
    NOW(),
    NOW()
),
(
    'مؤسسة الإنشاءات الحديثة',
    'contact@modern-construction.com',
    '0123456789',
    'جدة، حي الروضة، طريق الملك عبدالعزيز',
    'www.modern-construction.com',
    'الإنشاءات',
    'مؤسسة رائدة في مجال الإنشاءات والمقاولات',
    'active',
    NOW(),
    NOW()
),
(
    'شركة الخدمات التجارية',
    'info@commercial-services.com',
    '0134567890',
    'الدمام، حي الفيصلية',
    'www.commercial-services.com',
    'التجارة',
    'شركة متخصصة في الخدمات التجارية والتوزيع',
    'active',
    NOW(),
    NOW()
);
