import React, { useState } from 'react';
import SimpleButton from '../ui/SimpleButton';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { useNotifications } from '../notifications/NotificationSystem';
import { requestSpareParts, getPartsRequestStatus } from '../../services/technicianService';

const SparePartsRequest = ({ jobId, onSubmitted }) => {
  const notifications = useNotifications();
  const [partName, setPartName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [urgency, setUrgency] = useState('normal');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastRequestId, setLastRequestId] = useState(null);
  const [statusInfo, setStatusInfo] = useState(null);

  const validate = () => {
    if (!partName.trim()) {
      notifications.error('خطأ', { message: 'اسم قطعة الغيار مطلوب' });
      return false;
    }
    if (!quantity || Number(quantity) <= 0) {
      notifications.error('خطأ', { message: 'الكمية يجب أن تكون رقمًا موجبًا' });
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        jobId,
        partName: partName.trim(),
        quantity: Number(quantity),
        urgency,
        notes: notes.trim() || null,
      };
      const res = await requestSpareParts(payload);
      if (res?.success) {
        setLastRequestId(res.data?.id || null);
        notifications.success('تم الإرسال', { message: 'تم إرسال طلب قطع الغيار بنجاح' });
        if (onSubmitted) onSubmitted();
        setPartName('');
        setQuantity(1);
        setUrgency('normal');
        setNotes('');
      } else {
        notifications.error('خطأ', { message: res?.message || 'فشل إنشاء الطلب' });
      }
    } catch (e) {
      notifications.error('خطأ غير متوقع', { message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!lastRequestId) return;
    setLoading(true);
    try {
      const res = await getPartsRequestStatus(lastRequestId);
      if (res?.success) {
        setStatusInfo(res.data);
      } else {
        notifications.error('خطأ', { message: res?.message || 'تعذر جلب حالة الطلب' });
      }
    } catch (e) {
      notifications.error('خطأ', { message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <h3 className="font-semibold">طلب قطع غيار</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1">اسم القطعة</label>
          <Input value={partName} onChange={(e)=>setPartName(e.target.value)} placeholder="مثال: شريحة شحن" />
        </div>
        <div>
          <label className="block mb-1">الكمية</label>
          <Input type="number" min={1} value={quantity} onChange={(e)=>setQuantity(e.target.value)} />
        </div>
        <div>
          <label className="block mb-1">الأولوية</label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger>
              <SelectValue placeholder="اختر الأولوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">منخفض</SelectItem>
              <SelectItem value="normal">عادي</SelectItem>
              <SelectItem value="high">عاجل</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <label className="block mb-1">ملاحظات (اختياري)</label>
          <Textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="تفاصيل إضافية إن وجدت" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SimpleButton onClick={submit} disabled={loading}>{loading ? 'جارٍ الإرسال...' : 'إرسال الطلب'}</SimpleButton>
        {lastRequestId && (
          <>
            <SimpleButton variant="outline" onClick={checkStatus} disabled={loading}>تحديث الحالة</SimpleButton>
            <span className="text-sm text-gray-500">آخر طلب: #{lastRequestId}</span>
          </>
        )}
      </div>
      {statusInfo && (
        <div className="bg-gray-50 border rounded p-3 text-sm">
          <div>الحالة: <span className="font-medium">{statusInfo.status || 'غير معروف'}</span></div>
          {statusInfo.approvedBy && <div>الموافق: {statusInfo.approvedBy}</div>}
          {statusInfo.notes && <div>ملاحظات الإدارة: {statusInfo.notes}</div>}
        </div>
      )}
    </div>
  );
};

export default SparePartsRequest;

