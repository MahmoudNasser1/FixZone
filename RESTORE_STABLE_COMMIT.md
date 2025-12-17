# الرجوع إلى نقطة مستقرة "بعد تعديلات الامان"

## معلومات الـ Commit
- **الاسم**: بعد تعديلات الامان
- **ID**: `4a96aa5b58a7d13fe4cc7c18c5932820f278fbfe`
- **الاختصار**: `4a96aa5`

## الطريقة الآمنة (موصى بها)

### 1. حفظ التغييرات الحالية (إن وجدت)
```bash
cd /opt/lampp/htdocs/FixZone

# حفظ التغييرات الحالية في stash
git stash push -m "تغييرات قبل الرجوع للنقطة المستقرة"

# أو commit التغييرات الحالية
git add .
git commit -m "تغييرات قبل الرجوع"
```

### 2. إنشاء branch جديد من النقطة المستقرة
```bash
# إنشاء branch جديد من النقطة المستقرة
git checkout -b stable-security-updates 4a96aa5

# التحقق من أنك في النقطة الصحيحة
git log --oneline -5
```

### 3. دمج التغييرات المهمة (اختياري)
إذا كنت تريد بعض التغييرات من الـ main الحالي:
```bash
# الرجوع إلى main
git checkout main

# دمج التغييرات من branch المستقر
git merge stable-security-updates
```

### 4. رفع على VPS

#### الطريقة الأولى: Push إلى GitHub ثم Pull على VPS
```bash
# على الجهاز المحلي
git push origin stable-security-updates

# أو إذا أردت push الـ main بعد الدمج
git push origin main
```

ثم على VPS:
```bash
cd /home/deploy/FixZone

# Pull التغييرات
git pull origin main

# أو إذا استخدمت branch
git fetch origin
git checkout stable-security-updates
```

#### الطريقة الثانية: Reset مباشر على VPS (أسرع)
```bash
# على VPS
cd /home/deploy/FixZone

# حفظ التغييرات الحالية
git stash

# الرجوع إلى النقطة المستقرة
git reset --hard 4a96aa5

# إعادة تشغيل السيرفر
cd backend
pm2 restart fixzone-api
```

## الطريقة المباشرة (Reset - احذر!)

⚠️ **تحذير**: هذه الطريقة تحذف جميع التغييرات بعد هذا الـ commit!

### على الجهاز المحلي:
```bash
cd /opt/lampp/htdocs/FixZone

# حفظ التغييرات الحالية
git stash push -m "backup before reset"

# الرجوع إلى النقطة المستقرة
git reset --hard 4a96aa5

# التحقق
git log --oneline -5
```

### رفع على GitHub:
```bash
# Force push (احذر - يحذف التغييرات من GitHub أيضاً!)
git push origin main --force

# أو push إلى branch جديد
git push origin main:stable-security-updates
```

### على VPS:
```bash
cd /home/deploy/FixZone

# Pull التغييرات
git fetch origin
git reset --hard origin/main

# أو إذا استخدمت branch
git fetch origin
git checkout stable-security-updates
```

## الطريقة الآمنة الموصى بها (Step by Step)

### الخطوة 1: على الجهاز المحلي
```bash
cd /opt/lampp/htdocs/FixZone

# 1. حفظ التغييرات الحالية
git add .
git commit -m "حفظ التغييرات قبل الرجوع" || git stash

# 2. إنشاء branch من النقطة المستقرة
git checkout -b restore-stable-4a96aa5 4a96aa5

# 3. التحقق
git log --oneline -3
```

### الخطوة 2: رفع Branch الجديد
```bash
# رفع branch الجديد
git push origin restore-stable-4a96aa5
```

### الخطوة 3: على VPS
```bash
cd /home/deploy/FixZone

# إيقاف السيرفر
pm2 stop fixzone-api

# Pull branch الجديد
git fetch origin
git checkout restore-stable-4a96aa5

# أو إذا أردت merge مع main
git checkout main
git merge restore-stable-4a96aa5

# تثبيت الموديولات (إذا تغيرت)
cd backend
npm install --production

# إعادة تشغيل السيرفر
pm2 restart fixzone-api

# التحقق
pm2 logs fixzone-api --err --lines 10
```

## التحقق من النجاح

### على الجهاز المحلي:
```bash
git log --oneline -5
# يجب أن ترى: 4a96aa5 بعد تعديلات الامان
```

### على VPS:
```bash
cd /home/deploy/FixZone
git log --oneline -5
# يجب أن ترى نفس الـ commit

# التحقق من عمل السيرفر
pm2 status
pm2 logs fixzone-api --err --lines 10
```

## استعادة التغييرات المحذوفة (إذا احتجت)

```bash
# استعادة من stash
git stash list
git stash pop

# أو استعادة من commit سابق
git reflog
git checkout <commit-hash>
```

## ملاحظات مهمة

1. **احفظ نسخة احتياطية** قبل أي reset
2. **استخدم branch جديد** بدلاً من reset مباشر
3. **اختبر على VPS** قبل push إلى production
4. **تأكد من تثبيت الموديولات** بعد pull

## إذا واجهت مشاكل

### استعادة من reflog:
```bash
git reflog
# ابحث عن commit قبل reset
git reset --hard <commit-hash>
```

### استعادة من stash:
```bash
git stash list
git stash apply stash@{0}
```

