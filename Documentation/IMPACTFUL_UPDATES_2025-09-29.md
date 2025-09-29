# تحديثات مؤثرة مقترحة (2025-09-29)

> قائمة قصيرة مرتبة بالأولوية للتغييرات التي ستحدث فارقاً واضحاً في استقرار وتجربة FixZone.

## 1) الأداء وقاعدة البيانات (P0)
- إضافة فهارس:
  - `RepairRequest(customerId, status, createdAt)`
  - `Invoice(customerId, createdAt)`
  - `Payment(invoiceId, createdAt)`
  - `StockMovement(itemId, movementType, createdAt)`
- تقليل الاستعلامات المعتمدة على JOIN الغير ضروري في التقارير الثقيلة.
- كاش بسيط لبطاقات Dashboard (ذاكرة لمدة 60 ثانية).

## 2) توحيد استجابة الـ API (P0)
- اعتماد شكل ثابت: `{ success: true|false, data|error }` في كل المسارات.
- منع تسرب HTML في أخطاء الـ API (ضبط proxy/paths في الواجهة الأمامية).

## 3) الأمن (P0)
- نقل الأسرار إلى متغيرات بيئة `.env` (JWT_SECRET، DB creds).
- تفعيل Rate Limiting لمسارات المصادقة.
- تدقيق صلاحيات الدور على مستوى الراوتر.

## 4) المراقبة والسجلات (P1)
- Logger موحد (request id, duration, status) وError Boundary في الواجهة.
- Health Check: `/api/health` يعيد حالة DB/Cache.

## 5) تجربة المستخدم (P1)
- حالات فارغة ورسائل توست موحّدة.
- مؤشرات تحميل skeleton في جداول كبيرة.
- تثبيت نمط الألوان والخط وRTL عبر ThemeProvider مركزي.

## 6) سهولة التطوير والاختبار (P1)
- إعداد Playwright CI (Headless + Artifact screenshots عند الفشل).
- Seeders مستقلة لبيانات الاختبار السريعة.
- سكريبت `npm run dev:all` لتشغيل (DB check + backend + frontend) مع مراقبة.

## 7) التكامل والطباعة (P2)
- قوالب PDF موحدة (فاتورة/تسليم/فحص) بخيارات طباعة RTL.
- Webhooks للأحداث الحرجة (اكتمل الإصلاح/تم الدفع).

## 8) التدويل وإتاحة الوصول (P2)
- طبقة i18n للإنجليزية (لاحقاً) وحفظ تفضيل اللغة.
- مراجعة ARIA roles الأساسية.

> تنفيذ هذه العناصر سيُحسّن سرعة النظام وثباته وتجربة المستخدم النهائية بشكل ملموس.
