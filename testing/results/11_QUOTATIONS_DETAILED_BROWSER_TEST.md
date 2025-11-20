# 🌐 اختبار شامل لمديول العروض السعرية - المتصفح
## Quotations Module - Detailed Browser Test

**التاريخ:** 2025-11-18  
**المدرب:** Auto (Cursor AI)  
**الحالة:** 🔄 **جارٍ الاختبار**

---

## 🎯 الاختبار الشامل

### **الخطوة 1: الوصول للصفحة ✅**

#### **1.1 من Sidebar**
1. ✅ افتح `http://localhost:3000`
2. ✅ تأكد من تسجيل الدخول
3. ✅ **التحقق:** قسم "النظام المالي" **يجب أن يكون مفتوح** افتراضياً
4. ✅ **التحقق:** رابط "العروض السعرية" **يجب أن يكون ظاهر** في القسم
5. ✅ اضغط على "العروض السعرية"
6. ✅ **النتيجة:** URL يتغير إلى `http://localhost:3000/quotations`

#### **1.2 من URL مباشرة**
1. ✅ اذهب إلى `http://localhost:3000/quotations`
2. ✅ **النتيجة:** الصفحة تحمل بنجاح

---

### **الخطوة 2: عرض الصفحة الرئيسية ✅**

#### **2.1 Header Section**
- [ ] **Title:** "إدارة العروض السعرية" (text-3xl font-bold)
- [ ] **Subtitle:** "إنشاء وإدارة عروض الأسعار للعملاء"
- [ ] **Create Button:** "إضافة عرض سعري جديد" (visible, clickable, icon Plus)

#### **2.2 Filters Bar**
- [ ] **Search Box:**
  - Placeholder: "البحث في العروض السعرية..."
  - Icon: Search (في اليسار)
  - Input type: text
  - Width: w-64
  
- [ ] **Status Filter:**
  - Button: "جميع الحالات"
  - Dropdown button (icon: ChevronDown)
  - Clickable
  
- [ ] **Repair Filter:**
  - Button: "جميع طلبات الإصلاح"
  - Dropdown button (icon: ChevronDown)
  - Clickable
  
- [ ] **Date From Input:**
  - Placeholder: "من تاريخ"
  - Input type: date
  
- [ ] **Date To Input:**
  - Placeholder: "إلى تاريخ"
  - Input type: date
  
- [ ] **Refresh Button:**
  - Icon: RefreshCw
  - Clickable
  - Tooltip: "تحديث"

---

### **الخطوة 3: عرض البيانات (Cards View) ✅**

#### **3.1 Cards Container**
- [ ] **View Toggle:** 4 buttons (جدول, بطاقات, قائمة, شبكة)
- [ ] **Currently Active:** "بطاقات" (highlighted)
- [ ] **Items Count:** "X عنصر" (top right)
- [ ] **Column Selector:** "الأعمدة 7/10" (if in table view)

#### **3.2 Card Design (NEW IMPROVED)**
لكل Card، تحقق من:

**أ) Card Container:**
- [ ] Border: border-gray-200 (visible border)
- [ ] Padding: p-5 (spacious padding)
- [ ] Hover effect: shadow-lg on hover
- [ ] Cursor: pointer
- [ ] Background: white
- [ ] Rounded corners

**ب) Status Badge (Top Left):**
- [ ] Badge مع أيقونة StatusIcon (w-3.5 h-3.5)
- [ ] Text: الحالة (PENDING/SENT/APPROVED/REJECTED)
- [ ] Variant colors:
  - PENDING: warning/yellow
  - SENT: info/blue
  - APPROVED: success/green
  - REJECTED: destructive/red
- [ ] Padding: px-2.5 py-1
- [ ] Gap: gap-1.5 (between icon and text)

**ج) Amount (Large, Bold):**
- [ ] Font size: text-2xl (very large)
- [ ] Font weight: font-bold
- [ ] Color: text-gray-900
- [ ] Format: "600.00 EGP"
- [ ] Currency: text-base font-semibold text-gray-600 (smaller, different color)

**د) Customer Info:**
- [ ] Icon: Users (w-4 h-4, text-gray-400)
- [ ] Layout: flex items-center gap-2
- [ ] Label: "العميل:" (font-medium)
- [ ] Value: Customer name (text-gray-900)
- [ ] Text size: text-sm

**ه) Repair Request:**
- [ ] Icon: Wrench (w-4 h-4, text-gray-400)
- [ ] Layout: flex items-center gap-2
- [ ] Label: "طلب:"
- [ ] Value: Tracking token (text-blue-600, font-mono, text-xs)
- [ ] **Truncation:** إذا كان token > 20 char:
  - يظهر أول 20 char
  - يضاف "..."
  - مثال: "ca221badc4e471a1ad7..."
- [ ] Hover: hover:text-blue-700

**و) Notes:**
- [ ] Background: bg-gray-50 (light gray background)
- [ ] Padding: p-2
- [ ] Rounded: rounded
- [ ] Text: text-sm text-gray-600
- [ ] Line clamp: line-clamp-2 (max 2 lines)
- [ ] **Condition:** يظهر فقط إذا notes موجودة

**ز) Footer (Meta Info):**
- [ ] Border-top: border-gray-200 (visible line)
- [ ] Padding-top: pt-4
- [ ] Layout: flex items-center justify-between

**ح) Date:**
- [ ] Icon: Calendar (w-4 h-4, text-gray-400)
- [ ] Layout: flex items-center gap-1.5
- [ ] Format: Arabic date (ar-EG locale)
- [ ] Text: text-xs text-gray-600
- [ ] Example: "١٩‏/١١‏/٢٠٢٥"

**ط) Tax:**
- [ ] Icon: DollarSign (w-4 h-4, text-gray-400)
- [ ] Layout: flex items-center gap-1.5
- [ ] Format: "ضريبة: 108.00"
- [ ] Value: font-medium (bold number)
- [ ] Text: text-xs text-gray-600
- [ ] **Condition:** يظهر فقط إذا tax > 0

**ي) Device Type:**
- [ ] Icon: Monitor (w-4 h-4, text-gray-400)
- [ ] Layout: flex items-center gap-1.5
- [ ] Value: font-medium (bold)
- [ ] Text: text-xs text-gray-600
- [ ] **Condition:** يظهر فقط إذا deviceType موجود
- [ ] Example: "LAPTOP", "SMARTPHONE"

**ك) Action Buttons (Right Side):**
- [ ] Layout: flex items-center gap-1
  
  **Edit Button:**
  - Icon: Edit (w-4 h-4)
  - Size: h-8 w-8
  - Variant: ghost
  - Hover: hover:bg-blue-50 hover:text-blue-600
  - Title: "تعديل" (tooltip)
  - Click: يفتح Edit form
  
  **Delete Button:**
  - Icon: Trash2 (w-4 h-4)
  - Size: h-8 w-8
  - Variant: ghost
  - Color: text-red-600
  - Hover: hover:text-red-700 hover:bg-red-50
  - Title: "حذف" (tooltip)
  - Click: يفتح Delete confirmation

---

### **الخطوة 4: اختبار الفلاتر ✅**

#### **4.1 Filter by Status**
1. [ ] اضغط على زر "جميع الحالات"
2. [ ] **Dropdown يفتح:**
   - خيار "الكل" أو "جميع الحالات"
   - خيار "قيد الانتظار" (PENDING)
   - خيار "تم الإرسال" (SENT)
   - خيار "موافق عليه" (APPROVED)
   - خيار "مرفوض" (REJECTED)
3. [ ] اختر "قيد الانتظار"
4. [ ] **النتيجة:**
   - Dropdown يُغلق
   - Button text يتغير إلى "قيد الانتظار"
   - Cards تتحدث تلقائياً (لا حاجة لتحديث يدوي)
   - فقط Cards بالحالة PENDING تظهر
   - Status badges في Cards تظهر "قيد الانتظار"
   - العدد يتحدث (مثلاً: "2 عنصر")

#### **4.2 Filter by Repair Request**
1. [ ] اضغط على زر "جميع طلبات الإصلاح"
2. [ ] **Dropdown يفتح:**
   - قائمة طلبات الإصلاح
   - Format: "trackingToken - customerName"
   - أو "طلب #id - customerName"
   - Scrollable إذا كان هناك أكثر من 50
3. [ ] اختر طلب إصلاح (مثلاً: أول طلب)
4. [ ] **النتيجة:**
   - Dropdown يُغلق
   - Button text يتغير إلى اسم الطلب المختار
   - Cards تتحدث تلقائياً
   - فقط Cards المرتبطة بالطلب المختار تظهر
   - Tracking tokens في Cards تطابق الطلب المختار

#### **4.3 Filter by Date Range**
1. [ ] أدخل "من تاريخ" (مثلاً: 2025-01-01)
   - Date picker يفتح
   - اختر تاريخ
2. [ ] أدخل "إلى تاريخ" (مثلاً: 2025-12-31)
   - Date picker يفتح
   - اختر تاريخ
3. [ ] اضغط على زر "تحديث"
4. [ ] **النتيجة:**
   - Cards تتحدث
   - فقط Cards في النطاق الزمني تظهر
   - Dates في Cards ضمن النطاق المحدد
   - currentPage يعود إلى 1

#### **4.4 Search (Debounced)**
1. [ ] اكتب في صندوق البحث "البحث في العروض السعرية..."
2. [ ] **Debounce Test:**
   - اكتب بسرعة (مثلاً: "test")
   - **التحقق:** لا يتم البحث فوراً
   - انتظر **500ms** (نصف ثانية)
   - **التحقق:** Cards تتحدث بعد 500ms فقط
   - في Network tab (F12): يجب أن يكون هناك طلب واحد فقط بعد 500ms
3. [ ] **النتيجة:**
   - Cards تتحدث بعد debounce
   - البحث في notes و customerName
   - النتائج المطابقة تظهر فقط
   - إذا لم توجد نتائج: يظهر "لا توجد نتائج"

#### **4.5 Clear Filters**
1. [ ] بعد تطبيق فلاتر (Status, Repair, Date, Search)
2. [ ] ابحث عن زر "إعادة تعيين" أو "Clear" أو "مسح الفلاتر"
3. [ ] اضغط على الزر
4. [ ] **النتيجة:**
   - Status filter: يعود إلى "جميع الحالات"
   - Repair filter: يعود إلى "جميع طلبات الإصلاح"
   - Date filters: تُفرغ
   - Search: يُفرغ
   - Cards: جميع Cards تظهر مرة أخرى
   - currentPage: يعود إلى 1

---

### **الخطوة 5: اختبار الترتيب (Sorting) ✅**

#### **5.1 Sort in Table View**
1. [ ] اضغط على زر "جدول" (Table view)
2. [ ] **التحقق:** البيانات تظهر في جدول
3. [ ] اضغط على رأس عمود "المبلغ الإجمالي"
4. [ ] **النتيجة:**
   - البيانات ترتب تصاعدياً (ASC)
   - أيقونة ترتيب تظهر (ArrowUp أو ArrowDown)
   - ترتيب الأرقام صحيح (من الأقل للأكبر)
5. [ ] اضغط مرة أخرى على نفس العمود
6. [ ] **النتيجة:**
   - البيانات ترتب تنازلياً (DESC)
   - أيقونة ترتيب تتغير
   - ترتيب الأرقام صحيح (من الأكبر للأقل)

#### **5.2 Sort All Columns**
جرب الترتيب حسب كل عمود:
- [ ] ID (ascending/descending)
- [ ] Status (alphabetical)
- [ ] Total Amount (numerical)
- [ ] Tax Amount (numerical)
- [ ] Created At (date)
- [ ] Updated At (date)
- [ ] Sent At (date)
- [ ] Response At (date)

---

### **الخطوة 6: اختبار Views ✅**

#### **6.1 Table View**
1. [ ] اضغط على زر "جدول"
2. [ ] **النتيجة:**
   - البيانات تظهر في جدول
   - الأعمدة مرئية (ID, Status, Amount, Customer, etc.)
   - Actions في عمود منفصل
   - يمكن ترتيب الأعمدة (click header)
   - يمكن اختيار الأعمدة (column selector)
   - Pagination في الأسفل (if > 20 items)

#### **6.2 Cards View (Current - NEW DESIGN)**
1. [ ] اضغط على زر "بطاقات"
2. [ ] **النتيجة:**
   - البيانات تظهر كـ Cards
   - Layout محسّن (NEW DESIGN كما وصفنا)
   - Cards responsive:
     - Desktop: 3-4 Cards per row
     - Tablet: 2 Cards per row
     - Mobile: 1 Card per row
   - كل Card يعرض جميع المعلومات
   - Cards clickable (open edit form)

#### **6.3 List View**
1. [ ] اضغط على زر "قائمة"
2. [ ] **النتيجة:**
   - البيانات تظهر كقائمة
   - Layout مبسط (أقل تفاصيل من Cards)
   - Vertical layout
   - كل item في سطر منفصل

#### **6.4 Grid View**
1. [ ] اضغط على زر "شبكة"
2. [ ] **النتيجة:**
   - البيانات تظهر في شبكة
   - Cards أصغر حجماً
   - أكثر Cards لكل صف
   - Compact layout

---

### **الخطوة 7: اختبار الإنشاء (Create) ✅**

#### **7.1 Open Create Form**
1. [ ] اضغط على زر "إضافة عرض سعري جديد"
2. [ ] **النتيجة:**
   - Modal يفتح
   - Form فارغ
   - Title: "إضافة عرض سعري جديد"
   - Form fields: جميع الحقول فارغة
   - Submit button: "حفظ" أو "إنشاء"

#### **7.2 Form Fields**
تحقق من جميع الحقول:

- [ ] **Repair Request (Required):**
  - Label: "طلب الإصلاح" أو "Repair Request"
  - Type: Select/Dropdown
  - Options: قائمة طلبات الإصلاح
  - Format: "trackingToken - customerName"
  - Required indicator: * (asterisk)
  - Validation: لا يمكن حفظ بدون اختيار

- [ ] **Status:**
  - Label: "الحالة"
  - Type: Select
  - Options: PENDING, SENT, APPROVED, REJECTED
  - Default: PENDING
  - Required: No (optional)

- [ ] **Total Amount (Required):**
  - Label: "المبلغ الإجمالي"
  - Type: Number
  - Min: 0
  - Step: 0.01
  - Required indicator: *
  - Validation: يجب أن يكون >= 0

- [ ] **Tax Amount (Optional):**
  - Label: "الضريبة"
  - Type: Number
  - Min: 0
  - Step: 0.01
  - Default: 0

- [ ] **Currency:**
  - Label: "العملة"
  - Type: Select
  - Options: EGP, USD, EUR, etc.
  - Default: EGP

- [ ] **Sent At (Optional):**
  - Label: "تاريخ الإرسال"
  - Type: datetime-local
  - Format: YYYY-MM-DDTHH:mm

- [ ] **Response At (Optional):**
  - Label: "تاريخ الاستجابة"
  - Type: datetime-local
  - Format: YYYY-MM-DDTHH:mm

- [ ] **Notes (Optional):**
  - Label: "الملاحظات"
  - Type: Textarea
  - Max length: 2000
  - Placeholder: "أدخل ملاحظات..."

#### **7.3 Fill Form & Submit**
1. [ ] اختر Repair Request (required)
2. [ ] اختر Status (optional, default: PENDING)
3. [ ] أدخل Total Amount (مثلاً: 750.00)
4. [ ] أدخل Tax Amount (مثلاً: 135.00)
5. [ ] اختر Currency (مثلاً: EGP)
6. [ ] أدخل Sent At (optional)
7. [ ] أدخل Notes (optional)
8. [ ] اضغط على "حفظ"
9. [ ] **النتيجة:**
   - Modal يُغلق
   - Notification يظهر (نجاح) - "تم إنشاء العرض السعري بنجاح"
   - Card جديد يظهر في القائمة
   - البيانات صحيحة:
     - customerName صحيح
     - trackingToken صحيح
     - deviceType صحيح
     - totalAmount: 750.00
     - taxAmount: 135.00
     - status: PENDING

#### **7.4 Validation Testing**
1. [ ] **Test 1: بدون Repair Request**
   - اترك Repair Request فارغاً
   - اضغط "حفظ"
   - **النتيجة:** رسالة خطأ "Repair Request مطلوب"

2. [ ] **Test 2: Total Amount سالب**
   - أدخل Total Amount: -100
   - اضغط "حفظ"
   - **النتيجة:** رسالة خطأ "المبلغ يجب أن يكون >= 0"

3. [ ] **Test 3: Duplicate Repair Request**
   - اختر Repair Request موجود بالفعل في quotation آخر
   - اضغط "حفظ"
   - **النتيجة:** رسالة خطأ "Quotation already exists for this repair request"

4. [ ] **Test 4: Notes طويلة جداً**
   - أدخل Notes > 2000 char
   - **النتيجة:** لا يمكن كتابة أكثر من 2000 char

---

### **الخطوة 8: اختبار التعديل (Edit) ✅**

#### **8.1 Open Edit Form**
1. [ ] اضغط على زر "تعديل" (Edit icon) في أي Card
2. [ ] **النتيجة:**
   - Modal يفتح
   - Form مليء بالبيانات الحالية
   - Title: "تعديل عرض سعري"
   - **Repair Request disabled** (لا يمكن تغييره)
   - جميع الحقول الأخرى قابلة للتعديل

#### **8.2 Edit Fields**
1. [ ] غيّر Status (مثلاً: من PENDING إلى SENT)
2. [ ] غيّر Total Amount (مثلاً: من 600.00 إلى 650.00)
3. [ ] غيّر Tax Amount (مثلاً: من 108.00 إلى 117.00)
4. [ ] غيّر Notes
5. [ ] غيّر Sent At
6. [ ] غيّر Response At

#### **8.3 Submit Changes**
1. [ ] اضغط على "حفظ" أو "تحديث"
2. [ ] **النتيجة:**
   - Modal يُغلق
   - Notification يظهر (نجاح) - "تم تحديث العرض السعري بنجاح"
   - Card يتحدث تلقائياً
   - البيانات المحدثة صحيحة:
     - Status badge يتحدث في Card
     - Total Amount يتحدث
     - Tax Amount يتحدث
     - Notes تتحدث

---

### **الخطوة 9: اختبار الحذف (Delete) ✅**

#### **9.1 Delete Confirmation**
1. [ ] اضغط على زر "حذف" (Trash icon) في أي Card
2. [ ] **النتيجة:**
   - Confirmation dialog يظهر
   - Title: "تأكيد الحذف" أو "Confirm Delete"
   - Message: "هل أنت متأكد من حذف هذا العرض السعري؟" أو similar
   - Buttons: "تأكيد" و "إلغاء"

#### **9.2 Confirm Delete**
1. [ ] اضغط على "تأكيد" أو "حذف"
2. [ ] **النتيجة:**
   - Dialog يُغلق
   - Notification يظهر (نجاح) - "تم حذف العرض السعري بنجاح"
   - Card يختفي من القائمة
   - العدد يتحدث (مثلاً: من 3 إلى 2)
   - Pagination يتحدث (if applicable)

#### **9.3 Cancel Delete**
1. [ ] اضغط على "إلغاء"
2. [ ] **النتيجة:**
   - Dialog يُغلق
   - Card لا يزال موجوداً
   - لا يتم حذف أي شيء
   - لا توجد notifications

---

### **الخطوة 10: اختبار Navigation & Links ✅**

#### **10.1 Customer Link**
1. [ ] في Card، ابحث عن اسم العميل
2. [ ] **إذا كان link:** اضغط عليه
3. [ ] **النتيجة:**
   - يتم التوجيه إلى صفحة تفاصيل العميل
   - URL: `/customers/:id`
   - البيانات صحيحة

#### **10.2 Repair Request Link**
1. [ ] في Card، اضغط على Tracking Token (النص الأزرق)
2. [ ] **النتيجة:**
   - يتم التوجيه إلى `/repairs/:id`
   - صفحة تفاصيل طلب الإصلاح تفتح
   - البيانات صحيحة
   - يمكن العودة للخلف

#### **10.3 Breadcrumb**
1. [ ] في أعلى الصفحة، ابحث عن Breadcrumb
2. [ ] **النتيجة:**
   - "الرئيسية → quotations"
   - يمكن النقر على "الرئيسية" للعودة
   - Icon: Home

---

### **الخطوة 11: اختبار Pagination ✅**

#### **11.1 Pagination Controls**
1. [ ] إذا كان هناك أكثر من 20 quotation (أو limit المحدد)
2. [ ] **النتيجة:**
   - Pagination controls تظهر في الأسفل
   - Components:
     - "السابق" button (disabled if page 1)
     - رقم الصفحة الحالية
     - "التالي" button (disabled if last page)
     - Format: "الصفحة 1 من 3"
     - أو "Page 1 of 3"

#### **11.2 Navigate Pages**
1. [ ] اضغط على "التالي"
2. [ ] **النتيجة:**
   - Cards تتحدث
   - الصفحة التالية تظهر
   - رقم الصفحة يتحدث (مثلاً: من 1 إلى 2)
   - Cards مختلفة (من الصفحة التالية)
   - URL يتحدث: `?page=2`

3. [ ] اضغط على "السابق"
4. [ ] **النتيجة:**
   - Cards تتحدث
   - الصفحة السابقة تظهر
   - رقم الصفحة يتحدث (من 2 إلى 1)
   - Cards تعود للصفحة الأولى
   - URL يتحدث: `?page=1`

#### **11.3 Change Page Size**
1. [ ] ابحث عن selector "Items per page" أو similar
2. [ ] غيّر من 20 إلى 10
3. [ ] **النتيجة:**
   - Cards تتحدث
   - عدد Cards في الصفحة يتغير (من 20 إلى 10)
   - Pagination يتحدث (عدد الصفحات يزيد)

---

### **الخطوة 12: اختبار الأداء & Loading ✅**

#### **12.1 Loading States**
1. [ ] عند تحميل الصفحة أولاً (refresh)
2. [ ] **النتيجة:**
   - Loading spinner يظهر
   - Cards skeleton يظهر (CardLoadingSkeleton)
   - لا يوجد content فارغ
   - Loading يختفي بعد تحميل البيانات
   - Cards تظهر تدريجياً

#### **12.2 Debounce Search**
1. [ ] افتح DevTools (F12) → Network tab
2. [ ] اكتب في البحث بسرعة (مثلاً: "test")
3. [ ] **التحقق:**
   - في Network tab: لا توجد requests فورية
   - انتظر 500ms
   - **النتيجة:** طلب واحد فقط بعد 500ms
   - Debounce working correctly

#### **12.3 No Infinite Loops**
1. [ ] افتح Console (F12) → Console tab
2. [ ] **التحقق:**
   - لا توجد أخطاء "Maximum update depth exceeded"
   - لا توجد warnings
   - Console نظيف (فقط normal logs)
   - No re-render loops

#### **12.4 Performance**
1. [ ] افتح DevTools → Performance tab
2. [ ] Record performance أثناء:
   - تحميل الصفحة
   - تطبيق filters
   - Sort
   - Pagination
3. [ ] **التحقق:**
   - No lag أو freezing
   - Smooth animations
   - Fast responses (< 100ms)

---

### **الخطوة 13: اختبار Responsive Design ✅**

#### **13.1 Desktop (> 1024px)**
- [ ] Cards تظهر 3-4 Cards لكل صف
- [ ] Layout واضح ومنظم
- [ ] جميع العناصر مرئية
- [ ] Filters في صف واحد
- [ ] Sidebar مفتوح (if applicable)

#### **13.2 Tablet (768px - 1024px)**
- [ ] Cards تظهر 2 Cards لكل صف
- [ ] Layout responsive
- [ ] Filters تتكيف (قد تكون في dropdown)
- [ ] Sidebar قد يكون collapsed

#### **13.3 Mobile (< 768px)**
- [ ] Cards تظهر 1 Card لكل صف
- [ ] Filters في dropdown أو collapse
- [ ] Layout mobile-friendly
- [ ] Text readable (no overflow)
- [ ] Buttons clickable (adequate size)

---

### **الخطوة 14: اختبار Error Handling ✅**

#### **14.1 API Errors**
1. [ ] افتح DevTools → Network tab
2. [ ] اضغط على "Throttling" → "Offline"
3. [ ] حاول fetch quotations
4. [ ] **النتيجة:**
   - Error message يظهر
   - "حدث خطأ في تحميل بيانات العروض السعرية"
   - أو similar error message
   - UI لا يتعطل

#### **14.2 Empty State**
1. [ ] إذا لم توجد quotations
2. [ ] **النتيجة:**
   - Empty state يظهر
   - Message: "لا توجد عروض سعرية"
   - أو "No quotations found"
   - Icon أو illustration
   - Button: "إضافة عرض سعري جديد"

#### **14.3 Validation Errors**
1. [ ] اختبار جميع validation errors:
   - Required fields
   - Invalid formats
   - Min/Max values
   - Duplicate entries
2. [ ] **النتيجة:**
   - Error messages واضحة
   - Fields highlight (red border)
   - Messages بالعربية

---

### **الخطوة 15: اختبار QuotationItems ✅**

#### **15.1 View Items (if in details)**
1. [ ] افتح Quotation details (Edit form)
2. [ ] **التحقق:** هل هناك قسم "Items"؟
3. [ ] **إذا موجود:**
   - List of items يظهر
   - كل item يعرض:
     - Description
     - Quantity
     - Unit Price
     - Total Price
   - Actions: Edit/Delete لكل item

#### **15.2 Add Item**
1. [ ] في Quotation details
2. [ ] اضغط على "إضافة عنصر" أو "Add Item"
3. [ ] **Fill form:**
   - Description (required)
   - Quantity (required, >= 1)
   - Unit Price (required, >= 0)
   - Total Price (optional, auto-calculated)
4. [ ] Submit
5. [ ] **النتيجة:**
   - Item يظهر في القائمة
   - Total Price محسوب تلقائياً (quantity * unitPrice)

#### **15.3 Edit Item**
1. [ ] اضغط على "Edit" في item
2. [ ] غيّر Quantity (مثلاً: من 1 إلى 2)
3. [ ] Submit
4. [ ] **النتيجة:**
   - Total Price يتحدث تلقائياً (2 * unitPrice)
   - Item يتحدث في القائمة

#### **15.4 Delete Item**
1. [ ] اضغط على "Delete" في item
2. [ ] Confirm
3. [ ] **النتيجة:**
   - Item يختفي من القائمة
   - Quotation total يتحدث (if applicable)

---

## 📊 Test Results Summary

### **✅ Automated Tests (API)**
- ✅ GET /api/quotations: Working
- ✅ GET /api/quotations/:id: Working
- ✅ POST /api/quotations: Working
- ✅ PUT /api/quotations/:id: Working
- ✅ DELETE /api/quotations/:id: Working
- ✅ GET /api/quotationitems: Working
- ✅ POST /api/quotationitems: Working
- ✅ PUT /api/quotationitems/:id: Working
- ✅ DELETE /api/quotationitems/:id: Working
- ✅ Filters: Working
- ✅ Sorting: Working
- ✅ Pagination: Working
- ✅ Security: Protected
- ✅ Validation: Working

### **⏳ Manual Browser Tests**
- [ ] Sidebar: ___/3
- [ ] Page Load: ___/3
- [ ] Cards Display: ___/20
- [ ] Filters: ___/5
- [ ] Sorting: ___/9
- [ ] Views: ___/4
- [ ] Create: ___/4
- [ ] Edit: ___/3
- [ ] Delete: ___/3
- [ ] Navigation: ___/3
- [ ] Pagination: ___/3
- [ ] Performance: ___/4
- [ ] Responsive: ___/3
- [ ] Error Handling: ___/3
- [ ] QuotationItems: ___/4

**Total:** ___/70 tests

---

## 🐛 Issues Found

### **Issue 1:**
**Description:**
**Steps to Reproduce:**
**Expected Result:**
**Actual Result:**
**Screenshot:**
**Console Errors:**

### **Issue 2:**
**Description:**
**Steps to Reproduce:**
**Expected Result:**
**Actual Result:**
**Screenshot:**
**Console Errors:**

---

## ✅ Conclusion

### **Status: Ready for Testing ✅**

- ✅ **Code:** All fixes applied
- ✅ **Sidebar:** Fixed and visible
- ✅ **Cards UI:** Enhanced and improved
- ✅ **APIs:** Tested and working
- ⏳ **Browser Tests:** Manual testing required

---

**التاريخ:** 2025-11-18  
**الحالة:** ⏳ **Ready for Manual Browser Testing**

**Next Steps:**
1. Open `http://localhost:3000`
2. Login if needed
3. Click 'العروض السعرية' in Sidebar
4. Test all features according to this detailed guide
5. Report any issues found

