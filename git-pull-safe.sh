#!/bin/bash

# Script to safely pull from remote, handling package-lock.json conflicts

cd /opt/lampp/htdocs/FixZone

echo "🔄 جاري التحقق من التغييرات المحلية..."

# Check if there are any local changes
if git diff --quiet frontend/react-app/package-lock.json 2>/dev/null; then
    echo "✅ لا توجد تغييرات محلية في package-lock.json"
else
    echo "⚠️  تم اكتشاف تغييرات محلية في package-lock.json"
    echo "🔄 جاري حفظ التغييرات..."
    git stash push -m "Auto-stash before pull: $(date)" frontend/react-app/package-lock.json 2>/dev/null || true
fi

# Try to pull
echo "📥 جاري سحب التحديثات من الـ remote..."
if git pull https://github.com/MahmoudNasser1/FixZone 2>&1 | tee /tmp/git-pull-output.log; then
    echo "✅ تم سحب التحديثات بنجاح!"
    
    # If we stashed, try to pop (but don't fail if it doesn't work)
    if git stash list | grep -q "Auto-stash before pull"; then
        echo "🔄 جاري استعادة التغييرات المحلية..."
        git stash pop 2>/dev/null || echo "⚠️  لا يمكن استعادة التغييرات المحلية (قد تكون متضاربة)"
    fi
else
    # If pull failed due to package-lock.json conflict
    if grep -q "package-lock.json" /tmp/git-pull-output.log; then
        echo "⚠️  فشل السحب بسبب تضارب في package-lock.json"
        echo "🔄 جاري استخدام استراتيجية merge تقبل التغييرات من remote..."
        
        # Reset the file and try again
        git checkout --theirs frontend/react-app/package-lock.json 2>/dev/null || true
        git add frontend/react-app/package-lock.json
        
        # Try to complete the merge
        git merge --continue 2>/dev/null || {
            echo "🔄 جاري إعادة تعيين الملف..."
            git reset --hard HEAD
            git clean -fd
            echo "✅ تم إعادة التعيين. جرب git pull مرة أخرى"
        }
    else
        echo "❌ فشل السحب لسبب آخر. راجع الرسائل أعلاه."
    fi
fi

