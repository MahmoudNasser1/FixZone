import React from 'react';
import { useNotifications } from './NotificationSystem';
import SimpleButton from '../ui/SimpleButton';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../ui/SimpleCard';
import { 
  CheckCircle, AlertCircle, Info, AlertTriangle, 
  Clock, Zap, Download, Upload, Trash2, Save
} from 'lucide-react';

const NotificationDemo = () => {
  const notifications = useNotifications();

  const showSuccessNotification = () => {
    notifications.success('تم حفظ البيانات بنجاح!', {
      title: 'تم بنجاح',
      duration: 4000,
      showProgress: true
    });
  };

  const showErrorNotification = () => {
    notifications.error('فشل في الاتصال بالخادم. يرجى المحاولة مرة أخرى.', {
      title: 'خطأ في الاتصال',
      actions: [
        {
          label: 'إعادة المحاولة',
          onClick: () => {
            notifications.info('جاري إعادة المحاولة...');
          },
          variant: 'default'
        },
        {
          label: 'إلغاء',
          onClick: () => console.log('تم الإلغاء'),
          variant: 'ghost'
        }
      ]
    });
  };

  const showWarningNotification = () => {
    notifications.warning('انتباه: مساحة التخزين المتاحة أقل من 10%', {
      title: 'تحذير النظام',
      duration: 6000,
      actions: [
        {
          label: 'تنظيف الملفات',
          onClick: () => {
            notifications.loading('جاري تنظيف الملفات المؤقتة...', {
              title: 'تنظيف النظام'
            });
          }
        }
      ]
    });
  };

  const showInfoNotification = () => {
    notifications.info('تم إصدار تحديث جديد للنظام. يتضمن ميزات وتحسينات جديدة.', {
      title: 'تحديث متوفر',
      duration: 8000,
      actions: [
        {
          label: 'تحديث الآن',
          onClick: () => {
            const updateId = notifications.loading('جاري تحميل التحديث...', {
              title: 'تحديث النظام',
              showProgress: true
            });
            
            // محاكاة عملية التحديث
            setTimeout(() => {
              notifications.updateNotification(updateId, {
                type: 'success',
                title: 'تم التحديث',
                message: 'تم تحديث النظام بنجاح! سيتم إعادة تشغيل التطبيق.',
                persistent: false,
                duration: 3000
              });
            }, 3000);
          }
        },
        {
          label: 'لاحقاً',
          onClick: () => console.log('تأجيل التحديث'),
          variant: 'ghost'
        }
      ]
    });
  };

  const showLoadingNotification = () => {
    const loadingId = notifications.loading('جاري معالجة طلب الإصلاح...', {
      title: 'معالجة البيانات'
    });

    // محاكاة عملية معالجة
    setTimeout(() => {
      notifications.removeNotification(loadingId);
      notifications.success('تم إنشاء طلب الإصلاح بنجاح', {
        title: 'تم الإنشاء',
        message: 'رقم الطلب: #RP-2024-001',
        actions: [
          {
            label: 'عرض الطلب',
            onClick: () => console.log('عرض الطلب')
          }
        ]
      });
    }, 2500);
  };

  const showMultipleNotifications = () => {
    notifications.info('بدء عملية النسخ الاحتياطي...', {
      title: 'نسخ احتياطي',
      duration: 2000
    });

    setTimeout(() => {
      notifications.success('تم نسخ قاعدة البيانات', {
        title: 'نسخ احتياطي',
        duration: 2000
      });
    }, 1000);

    setTimeout(() => {
      notifications.success('تم نسخ الملفات', {
        title: 'نسخ احتياطي',
        duration: 2000
      });
    }, 2000);

    setTimeout(() => {
      notifications.success('تم إكمال النسخ الاحتياطي بنجاح', {
        title: 'اكتمل النسخ الاحتياطي',
        duration: 4000,
        showProgress: true
      });
    }, 3000);
  };

  const showFileUploadNotification = () => {
    const files = ['صورة_الجهاز.jpg', 'تقرير_التشخيص.pdf', 'فاتورة_القطع.xlsx'];
    
    files.forEach((fileName, index) => {
      setTimeout(() => {
        const uploadId = notifications.loading(`جاري رفع ${fileName}...`, {
          title: 'رفع الملفات'
        });

        setTimeout(() => {
          notifications.removeNotification(uploadId);
          notifications.success(`تم رفع ${fileName} بنجاح`, {
            title: 'تم الرفع',
            duration: 2000
          });
        }, 1500 + (index * 500));
      }, index * 800);
    });
  };

  const clearAllNotifications = () => {
    notifications.clearAllNotifications();
    notifications.info('تم مسح جميع الإشعارات', {
      duration: 2000
    });
  };

  return (
    <SimpleCard className="max-w-2xl mx-auto">
      <SimpleCardHeader>
        <SimpleCardTitle className="flex items-center">
          <Zap className="w-5 h-5 ml-2" />
          تجربة نظام الإشعارات
        </SimpleCardTitle>
      </SimpleCardHeader>
      
      <SimpleCardContent>
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            اختبر أنواع مختلفة من الإشعارات لمعاينة كيفية عملها في النظام
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SimpleButton 
              onClick={showSuccessNotification}
              className="flex items-center justify-center space-x-2 space-x-reverse bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              <span>إشعار نجاح</span>
            </SimpleButton>

            <SimpleButton 
              onClick={showErrorNotification}
              className="flex items-center justify-center space-x-2 space-x-reverse bg-red-600 hover:bg-red-700"
            >
              <AlertCircle className="w-4 h-4" />
              <span>إشعار خطأ</span>
            </SimpleButton>

            <SimpleButton 
              onClick={showWarningNotification}
              className="flex items-center justify-center space-x-2 space-x-reverse bg-yellow-600 hover:bg-yellow-700"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>إشعار تحذير</span>
            </SimpleButton>

            <SimpleButton 
              onClick={showInfoNotification}
              className="flex items-center justify-center space-x-2 space-x-reverse bg-blue-600 hover:bg-blue-700"
            >
              <Info className="w-4 h-4" />
              <span>إشعار معلومات</span>
            </SimpleButton>

            <SimpleButton 
              onClick={showLoadingNotification}
              className="flex items-center justify-center space-x-2 space-x-reverse bg-gray-600 hover:bg-gray-700"
            >
              <Clock className="w-4 h-4" />
              <span>إشعار تحميل</span>
            </SimpleButton>

            <SimpleButton 
              onClick={showFileUploadNotification}
              className="flex items-center justify-center space-x-2 space-x-reverse bg-purple-600 hover:bg-purple-700"
            >
              <Upload className="w-4 h-4" />
              <span>رفع ملفات</span>
            </SimpleButton>

            <SimpleButton 
              onClick={showMultipleNotifications}
              className="flex items-center justify-center space-x-2 space-x-reverse bg-indigo-600 hover:bg-indigo-700"
            >
              <Save className="w-4 h-4" />
              <span>إشعارات متعددة</span>
            </SimpleButton>

            <SimpleButton 
              onClick={clearAllNotifications}
              variant="outline"
              className="flex items-center justify-center space-x-2 space-x-reverse"
            >
              <Trash2 className="w-4 h-4" />
              <span>مسح الكل</span>
            </SimpleButton>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">ميزات نظام الإشعارات:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• إشعارات فورية مع أنواع مختلفة (نجاح، خطأ، تحذير، معلومات، تحميل)</li>
              <li>• إجراءات تفاعلية مع الأزرار</li>
              <li>• إشعارات مؤقتة أو دائمة</li>
              <li>• شريط تقدم للإشعارات المؤقتة</li>
              <li>• إمكانية تحديث الإشعارات ديناميكياً</li>
              <li>• مركز إشعارات في الشريط العلوي</li>
              <li>• تحكم كامل في المدة والموقع</li>
            </ul>
          </div>
        </div>
      </SimpleCardContent>
    </SimpleCard>
  );
};

export default NotificationDemo;
