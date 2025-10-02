# 🎨 تصميم واجهات المستخدم - نظام المخزون
## UI/UX Design Plan - Inventory Module

**التاريخ:** 2 أكتوبر 2025  
**الهدف:** تصميم واجهات مستخدم حديثة وسهلة الاستخدام

---

## 🎯 مبادئ التصميم

### 1. البساطة (Simplicity)
- واجهات نظيفة وبسيطة
- عدم ازدحام الشاشة بالمعلومات
- التركيز على المهمة الرئيسية

### 2. الوضوح (Clarity)
- عناوين واضحة
- أيقونات معبرة
- ألوان ذات دلالة (أحمر=خطر، أخضر=نجاح، إلخ)

### 3. الاتساق (Consistency)
- نفس الأنماط في جميع الصفحات
- نفس موضع الأزرار والقوائم
- توحيد الألوان والخطوط

### 4. الاستجابة (Responsiveness)
- تصميم متجاوب يعمل على جميع الأجهزة
- تجربة سلسة على الموبايل والتابلت

---

## 🎨 نظام الألوان

### الألوان الرئيسية:
```css
/* Primary Colors */
--primary-color: #1976d2;      /* أزرق - الإجراءات الرئيسية */
--secondary-color: #dc004e;    /* وردي - الإجراءات الثانوية */

/* Status Colors */
--success-color: #4caf50;      /* أخضر - نجاح */
--warning-color: #ff9800;      /* برتقالي - تحذير */
--error-color: #f44336;        /* أحمر - خطأ */
--info-color: #2196f3;         /* أزرق فاتح - معلومة */

/* Neutral Colors */
--background: #f5f5f5;         /* خلفية الصفحة */
--surface: #ffffff;            /* خلفية الكروت */
--text-primary: #212121;       /* نص رئيسي */
--text-secondary: #757575;     /* نص ثانوي */
--border: #e0e0e0;            /* حدود */
```

### دلالات الألوان في المخزون:
- 🟢 **أخضر:** مخزون كافٍ، عملية ناجحة
- 🟡 **برتقالي/أصفر:** مخزون منخفض، تحذير
- 🔴 **أحمر:** نفذ من المخزون، خطأ
- 🔵 **أزرق:** معلومة، إجراء رئيسي

---

## 📱 الصفحات الرئيسية

### 1. صفحة نظرة عامة - Inventory Dashboard

#### Layout:
```
┌─────────────────────────────────────────────────────────┐
│ 📦 لوحة تحكم المخزون                                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │ 📊      │ │ 💰      │ │ ⚠️       │ │ ❌      │        │
│ │ 156     │ │ 1.25M   │ │ 12      │ │ 3       │        │
│ │ أصناف   │ │ قيمة    │ │ منخفض   │ │ نفذ     │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                                           │
│ ┌───────────────────────┐ ┌───────────────────────┐    │
│ │ 📈 اتجاه المخزون      │ │ 🏆 الأصناف الأكثر     │    │
│ │  LineChart            │ │    استخداماً          │    │
│ │                       │ │    BarChart           │    │
│ └───────────────────────┘ └───────────────────────┘    │
│                                                           │
│ ┌───────────────────────────────────────────────────┐   │
│ │ ⚠️ تنبيهات عاجلة                                  │   │
│ │ • شاشة LCD Samsung A50 - منخفض (8 قطع)    [عرض] │   │
│ │ • بطارية iPhone 11 - نفذ (0 قطع)          [طلب] │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 🔄 آخر الحركات                                    │   │
│ │ [جدول الحركات الأخيرة]                            │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

#### Components:

**1. Stat Cards (كروت الإحصائيات):**
```javascript
<Grid container spacing={3}>
  <Grid item xs={12} sm={6} md={3}>
    <Card sx={{ p: 2, textAlign: 'center' }}>
      <Box sx={{ color: 'primary.main', fontSize: 48 }}>
        <Inventory />
      </Box>
      <Typography variant="h4" sx={{ mt: 1 }}>
        {stats.totalItems}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        إجمالي الأصناف
      </Typography>
      <Typography variant="caption" color="success.main">
        +5 هذا الشهر
      </Typography>
    </Card>
  </Grid>
  {/* باقي الكروت... */}
</Grid>
```

**2. Charts:**
```javascript
<Card sx={{ p: 2, mt: 3 }}>
  <Typography variant="h6" gutterBottom>
    📈 اتجاه المخزون - آخر 30 يوم
  </Typography>
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={inventoryTrend}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="totalValue" 
        stroke="#1976d2" 
        name="قيمة المخزون"
      />
      <Line 
        type="monotone" 
        dataKey="totalItems" 
        stroke="#4caf50" 
        name="عدد الأصناف"
      />
    </LineChart>
  </ResponsiveContainer>
</Card>
```

**3. Alerts Section:**
```javascript
<Card sx={{ p: 2, mt: 3 }}>
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    <Warning sx={{ color: 'warning.main', mr: 1 }} />
    <Typography variant="h6">تنبيهات عاجلة</Typography>
    <Chip 
      label={alerts.length} 
      color="error" 
      size="small" 
      sx={{ ml: 1 }}
    />
  </Box>
  <List>
    {alerts.map(alert => (
      <ListItem key={alert.id}>
        <ListItemIcon>
          {alert.severity === 'critical' ? 
            <Error color="error" /> : 
            <Warning color="warning" />
          }
        </ListItemIcon>
        <ListItemText 
          primary={alert.itemName}
          secondary={alert.message}
        />
        <Button size="small" variant="outlined">
          عرض
        </Button>
      </ListItem>
    ))}
  </List>
</Card>
```

---

### 2. صفحة إدارة الأصناف - Inventory Management

#### Layout:
```
┌─────────────────────────────────────────────────────────┐
│ 📦 إدارة الأصناف                          [+ إضافة صنف] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────────────────────────────────┐     │
│ │ 🔍 [      بحث...     ] [الفئة ▼] [الحالة ▼]   │     │
│ └─────────────────────────────────────────────────┘     │
│                                                           │
│ ┌───────────────────────────────────────────────────┐   │
│ │ الاسم        | الفئة    | المخزون  | الحالة | ... │   │
│ ├───────────────────────────────────────────────────┤   │
│ │ شاشة LCD     | شاشات   | 45 🟢    | نشط    | ⚙️  │   │
│ │ بطارية       | بطاريات | 8 🟡     | نشط    | ⚙️  │   │
│ │ كابل USB    | كابلات  | 0 🔴     | نشط    | ⚙️  │   │
│ └───────────────────────────────────────────────────┘   │
│ Pagination: [1] 2 3 ... 8                                │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

#### Features:

**1. فلاتر متقدمة:**
```javascript
<Box sx={{ mb: 3 }}>
  <Grid container spacing={2} alignItems="center">
    {/* بحث */}
    <Grid item xs={12} md={4}>
      <TextField
        fullWidth
        placeholder="ابحث عن صنف..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />
    </Grid>
    
    {/* الفئة */}
    <Grid item xs={12} md={2}>
      <FormControl fullWidth>
        <InputLabel>الفئة</InputLabel>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <MenuItem value="">الكل</MenuItem>
          {categories.map(cat => (
            <MenuItem key={cat.id} value={cat.id}>
              {cat.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
    
    {/* الحالة */}
    <Grid item xs={12} md={2}>
      <FormControl fullWidth>
        <InputLabel>الحالة</InputLabel>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <MenuItem value="">الكل</MenuItem>
          <MenuItem value="active">نشط</MenuItem>
          <MenuItem value="inactive">غير نشط</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    
    {/* المخزون */}
    <Grid item xs={12} md={2}>
      <FormControl fullWidth>
        <InputLabel>المخزون</InputLabel>
        <Select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
          <MenuItem value="">الكل</MenuItem>
          <MenuItem value="low">منخفض</MenuItem>
          <MenuItem value="out">نفذ</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    
    {/* زر الإضافة */}
    <Grid item xs={12} md={2}>
      <Button
        fullWidth
        variant="contained"
        startIcon={<Add />}
        onClick={() => setOpenDialog(true)}
      >
        إضافة صنف
      </Button>
    </Grid>
  </Grid>
</Box>
```

**2. الجدول:**
```javascript
<TableContainer component={Paper}>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>الصورة</TableCell>
        <TableCell>
          <TableSortLabel
            active={sortBy === 'name'}
            direction={sortOrder}
            onClick={() => handleSort('name')}
          >
            الاسم
          </TableSortLabel>
        </TableCell>
        <TableCell>SKU</TableCell>
        <TableCell>الفئة</TableCell>
        <TableCell>المخزون</TableCell>
        <TableCell>سعر الشراء</TableCell>
        <TableCell>سعر البيع</TableCell>
        <TableCell>الحالة</TableCell>
        <TableCell>إجراءات</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {items.map(item => (
        <TableRow key={item.id} hover>
          <TableCell>
            <Avatar 
              src={item.image} 
              variant="rounded"
              sx={{ width: 50, height: 50 }}
            >
              {item.name[0]}
            </Avatar>
          </TableCell>
          <TableCell>
            <Typography variant="body2" fontWeight="bold">
              {item.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.brand} {item.model}
            </Typography>
          </TableCell>
          <TableCell>
            <Chip label={item.sku} size="small" variant="outlined" />
          </TableCell>
          <TableCell>{item.categoryName}</TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                color={getStockColor(item.totalQuantity, item.reorderPoint)}
              >
                {item.totalQuantity}
              </Typography>
              {item.totalQuantity <= item.reorderPoint && (
                <Warning 
                  sx={{ ml: 0.5 }} 
                  fontSize="small" 
                  color="warning" 
                />
              )}
            </Box>
          </TableCell>
          <TableCell>{formatCurrency(item.purchasePrice)}</TableCell>
          <TableCell>{formatCurrency(item.sellingPrice)}</TableCell>
          <TableCell>
            <Chip 
              label={item.isActive ? 'نشط' : 'غير نشط'}
              color={item.isActive ? 'success' : 'default'}
              size="small"
            />
          </TableCell>
          <TableCell>
            <IconButton 
              size="small" 
              onClick={() => handleView(item)}
              title="عرض التفاصيل"
            >
              <Visibility />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => handleEdit(item)}
              title="تعديل"
            >
              <Edit />
            </IconButton>
            <IconButton 
              size="small" 
              color="error"
              onClick={() => handleDelete(item)}
              title="حذف"
            >
              <Delete />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

---

### 3. نموذج إضافة/تعديل صنف - Add/Edit Item Dialog

#### Layout:
```
┌─────────────────────────────────────────────────────┐
│ ✏️ إضافة صنف جديد                           [✕]     │
├─────────────────────────────────────────────────────┤
│                                                       │
│ ┌─ المعلومات الأساسية ────────────────────────┐    │
│ │                                                │    │
│ │ [صورة القطعة]  📤 رفع صورة                    │    │
│ │                                                │    │
│ │ اسم الصنف *                                    │    │
│ │ [                                      ]       │    │
│ │                                                │    │
│ │ SKU                 |  الباركود               │    │
│ │ [          ]        |  [          ]           │    │
│ │                                                │    │
│ │ رقم القطعة (Part Number)                      │    │
│ │ [                                      ]       │    │
│ │                                                │    │
│ │ العلامة التجارية   |  الموديل                │    │
│ │ [          ]        |  [          ]           │    │
│ │                                                │    │
│ │ الفئة              |  الحالة                  │    │
│ │ [الشاشات ▼ ]      |  [جديد ▼ ]              │    │
│ │                                                │    │
│ └────────────────────────────────────────────────┘    │
│                                                       │
│ ┌─ الأسعار ──────────────────────────────────┐      │
│ │                                                │    │
│ │ سعر الشراء         |  سعر البيع              │    │
│ │ [    150.00  ]     |  [    250.00  ]        │    │
│ │                                                │    │
│ │ الوحدة: [قطعة ▼]                              │    │
│ │                                                │    │
│ └────────────────────────────────────────────────┘    │
│                                                       │
│ ┌─ إعدادات المخزون ─────────────────────────┐      │
│ │                                                │    │
│ │ الحد الأدنى         |  كمية إعادة الطلب       │    │
│ │ [     10     ]     |  [     50     ]        │    │
│ │                                                │    │
│ │ مدة التوريد (أيام) |  مدة الضمان (أيام)     │    │
│ │ [      7     ]     |  [     90     ]        │    │
│ │                                                │    │
│ │ المورد المفضل                                  │    │
│ │ [شركة الإلكترونيات المتقدمة ▼]               │    │
│ │                                                │    │
│ └────────────────────────────────────────────────┘    │
│                                                       │
│ ┌─ معلومات إضافية ──────────────────────────┐      │
│ │                                                │    │
│ │ الوصف                                          │    │
│ │ [                                      ]       │    │
│ │ [                                      ]       │    │
│ │                                                │    │
│ │ الوزن (كجم)         |  الأبعاد                │    │
│ │ [    0.05    ]     |  [10x5x0.3]            │    │
│ │                                                │    │
│ │ موقع التخزين (رف-صف)                          │    │
│ │ [    A-12-3         ]                         │    │
│ │                                                │    │
│ │ ملاحظات                                        │    │
│ │ [                                      ]       │    │
│ │                                                │    │
│ └────────────────────────────────────────────────┘    │
│                                                       │
│                       [إلغاء]    [حفظ]               │
│                                                       │
└─────────────────────────────────────────────────────┘
```

#### Validation:
```javascript
const validationSchema = Yup.object({
  name: Yup.string().required('اسم الصنف مطلوب'),
  purchasePrice: Yup.number()
    .required('سعر الشراء مطلوب')
    .min(0, 'السعر يجب أن يكون موجب'),
  sellingPrice: Yup.number()
    .required('سعر البيع مطلوب')
    .min(0, 'السعر يجب أن يكون موجب')
    .test('greater-than-purchase', 'سعر البيع يجب أن يكون أكبر من سعر الشراء', 
      function(value) {
        return value > this.parent.purchasePrice;
      }
    ),
  categoryId: Yup.number().required('الفئة مطلوبة'),
  reorderPoint: Yup.number().min(0, 'الحد الأدنى يجب أن يكون موجب'),
});
```

---

### 4. صفحة حركات المخزون - Stock Movements

#### Layout:
```
┌─────────────────────────────────────────────────────────┐
│ 🔄 حركات المخزون                     [+ تسجيل حركة]    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ ┌─────────────────────────────────────────────────┐     │
│ │ التاريخ: [من] [01/10/2025] [إلى] [31/10/2025] │     │
│ │ النوع: [الكل ▼]  المخزن: [الكل ▼]  الصنف: []  │     │
│ └─────────────────────────────────────────────────┘     │
│                                                           │
│ ┌───────────────────────────────────────────────────┐   │
│ │ التاريخ | النوع | الصنف | المخزن | الكمية | ... │   │
│ ├───────────────────────────────────────────────────┤   │
│ │ 01/10  | ⬆️ IN  | LCD   | رئيسي  | +50     | ... │   │
│ │ 01/10  | ⬇️ OUT | بطارية| رئيسي  | -2      | ... │   │
│ │ 02/10  | 🔄 TRF | LCD   | جيزة   | 10→     | ... │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│ ┌─────────────────────────────────────────────────┐     │
│ │ ملخص الفترة:                                    │     │
│ │ إجمالي الإدخالات: 150 | إجمالي الصرف: 85       │     │
│ │ صافي الحركة: +65                                │     │
│ └─────────────────────────────────────────────────┘     │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

#### Icons للحركات:
```javascript
const getMovementIcon = (type) => {
  switch(type) {
    case 'in': return <ArrowDownward color="success" />;
    case 'out': return <ArrowUpward color="error" />;
    case 'transfer_in': return <ArrowForward color="info" />;
    case 'transfer_out': return <ArrowBack color="info" />;
    case 'adjustment': return <Build color="warning" />;
    case 'reserve': return <Lock color="warning" />;
    case 'unreserve': return <LockOpen color="success" />;
    case 'write_off': return <Delete color="error" />;
    default: return <SwapHoriz />;
  }
};
```

---

### 5. صفحة نقل المخزون - Stock Transfer

#### Stepper UI:
```
┌─────────────────────────────────────────────────────────┐
│ 🚚 نقل المخزون بين الفروع                               │
├─────────────────────────────────────────────────────────┤
│                                                           │
│   ① تفاصيل النقل  ─────  ② اختيار الأصناف  ─────  ③ مراجعة │
│   ●──────────────────────○──────────────────────○        │
│                                                           │
│ ┌─ الخطوة 1: تفاصيل النقل ─────────────────────┐       │
│ │                                                 │       │
│ │ من المخزن *                                     │       │
│ │ [المستودع الرئيسي - القاهرة ▼]                │       │
│ │                                                 │       │
│ │ إلى المخزن *                                    │       │
│ │ [مستودع الجيزة - فرع الهرم ▼]                 │       │
│ │                                                 │       │
│ │ تاريخ النقل                                     │       │
│ │ [05/10/2025]                                    │       │
│ │                                                 │       │
│ │ تاريخ الوصول المتوقع                            │       │
│ │ [06/10/2025]                                    │       │
│ │                                                 │       │
│ │ سبب النقل                                       │       │
│ │ [نقص في فرع الجيزة                     ]       │       │
│ │                                                 │       │
│ └─────────────────────────────────────────────────┘       │
│                                                           │
│                                    [التالي →]             │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

### 6. صفحة الجرد - Stock Count

#### Layout (صفحة الجرد النشط):
```
┌─────────────────────────────────────────────────────────┐
│ 📊 جرد المخزون - CNT-2025-09             [⚙️ إعدادات] │
├─────────────────────────────────────────────────────────┤
│                                                           │
│ المخزن: المستودع الرئيسي      التاريخ: 01/10/2025      │
│ الحالة: 🟡 قيد التنفيذ                                  │
│                                                           │
│ Progress: ████████░░░░░░░░ 55%  (85/156 صنف)           │
│                                                           │
│ ┌─────────────────────────────────────────────────┐     │
│ │ 📱 [مسح الباركود]                   🔍 [بحث...]│     │
│ └─────────────────────────────────────────────────┘     │
│                                                           │
│ ┌───────────────────────────────────────────────────┐   │
│ │ الصنف        | في النظام | العد الفعلي | الفرق  │   │
│ ├───────────────────────────────────────────────────┤   │
│ │ LCD Samsung  |    45     | [  43  ] ✅  | -2 🔴  │   │
│ │ بطارية       |    90     | [  92  ] ✅  | +2 🟢  │   │
│ │ كابل USB    |    30     | [     ] ⏳  |  -     │   │
│ └───────────────────────────────────────────────────┘   │
│                                                           │
│ ملخص:                                                    │
│ • تمت المطابقة: 85 صنف                                  │
│ • بها فروقات: 12 صنف                                   │
│ • متبقي: 71 صنف                                         │
│                                                           │
│                   [حفظ وإكمال لاحقاً]  [إتمام الجرد]    │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

#### Barcode Scanner Component:
```javascript
<Box sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100', borderRadius: 2 }}>
  <QrCodeScanner sx={{ fontSize: 60, color: 'primary.main' }} />
  <Typography variant="h6" sx={{ mt: 1 }}>
    امسح الباركود لإضافة صنف
  </Typography>
  <Button 
    variant="contained" 
    startIcon={<CameraAlt />}
    onClick={startScanning}
    sx={{ mt: 2 }}
  >
    تشغيل الكاميرا
  </Button>
  
  {/* أو إدخال يدوي */}
  <TextField
    fullWidth
    placeholder="أو أدخل الباركود يدوياً"
    value={barcodeInput}
    onChange={(e) => setBarcodeInput(e.target.value)}
    onKeyPress={handleBarcodeEnter}
    sx={{ mt: 2 }}
    InputProps={{
      endAdornment: (
        <IconButton onClick={handleBarcodeSubmit}>
          <Search />
        </IconButton>
      )
    }}
  />
</Box>
```

---

## 🎨 Components مشتركة

### 1. StockStatusBadge

```javascript
const StockStatusBadge = ({ quantity, reorderPoint }) => {
  let color, icon, label;
  
  if (quantity === 0) {
    color = 'error';
    icon = <Error />;
    label = 'نفذ';
  } else if (quantity <= reorderPoint) {
    color = 'warning';
    icon = <Warning />;
    label = 'منخفض';
  } else {
    color = 'success';
    icon = <CheckCircle />;
    label = 'كافٍ';
  }
  
  return (
    <Chip 
      icon={icon}
      label={`${quantity} - ${label}`}
      color={color}
      size="small"
    />
  );
};
```

---

### 2. ItemCard (للعرض في Grid)

```javascript
<Card>
  <CardMedia
    component="img"
    height="140"
    image={item.image || '/placeholder.png'}
    alt={item.name}
  />
  <CardContent>
    <Typography variant="h6" noWrap>
      {item.name}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {item.brand} {item.model}
    </Typography>
    
    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="body2">المخزون:</Typography>
      <StockStatusBadge 
        quantity={item.totalQuantity} 
        reorderPoint={item.reorderPoint}
      />
    </Box>
    
    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="body2">السعر:</Typography>
      <Typography variant="body2" fontWeight="bold">
        {formatCurrency(item.sellingPrice)}
      </Typography>
    </Box>
  </CardContent>
  <CardActions>
    <Button size="small" startIcon={<Visibility />}>
      عرض
    </Button>
    <Button size="small" startIcon={<Edit />}>
      تعديل
    </Button>
  </CardActions>
</Card>
```

---

## 📱 Mobile Optimization

### Responsive Breakpoints:
```javascript
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,      // Mobile
      sm: 600,    // Tablet
      md: 900,    // Desktop
      lg: 1200,   // Large Desktop
      xl: 1536,   // Extra Large
    },
  },
});
```

### Mobile-First Tables:
```javascript
// على الموبايل: تحويل الجدول لكروت
const isMobile = useMediaQuery(theme.breakpoints.down('md'));

{isMobile ? (
  // Mobile: Cards
  <Grid container spacing={2}>
    {items.map(item => (
      <Grid item xs={12} sm={6} key={item.id}>
        <ItemCard item={item} />
      </Grid>
    ))}
  </Grid>
) : (
  // Desktop: Table
  <Table>
    {/* ... */}
  </Table>
)}
```

---

## ✅ ملخص التصميم

**الأهداف المحققة:**
- ✅ واجهات بسيطة وواضحة
- ✅ ألوان ذات دلالة
- ✅ responsive على جميع الأجهزة
- ✅ سهولة الاستخدام
- ✅ تجربة مستخدم ممتازة

**Components الرئيسية:**
- ✅ Dashboard (لوحة التحكم)
- ✅ Inventory Management (إدارة الأصناف)
- ✅ Stock Movements (الحركات)
- ✅ Stock Transfer (النقل)
- ✅ Stock Count (الجرد)
- ✅ Alerts (التنبيهات)
- ✅ Reports (التقارير)

---

**للانتقال للوثيقة التالية:**
- [← خارطة الطريق](./05_PHASED_ROADMAP.md)
- [→ خطة الاختبارات](./07_TESTING_STRATEGY.md)

