import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNotifications } from '../notifications/NotificationSystem';
import technicianService from '../../services/technicianService';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/Select';
import SimpleButton from '../ui/SimpleButton';

const TechnicianSkillForm = ({ technicianId, skill, onClose, onSuccess }) => {
  const notifications = useNotifications();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    skillName: '',
    skillLevel: 'intermediate',
    certification: '',
    certificationDate: '',
    expiryDate: '',
    notes: ''
  });

  useEffect(() => {
    if (skill) {
      setFormData({
        skillName: skill.skillName || '',
        skillLevel: skill.skillLevel || 'intermediate',
        certification: skill.certification || '',
        certificationDate: skill.certificationDate ? skill.certificationDate.split('T')[0] : '',
        expiryDate: skill.expiryDate ? skill.expiryDate.split('T')[0] : '',
        notes: skill.notes || ''
      });
    }
  }, [skill]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.skillName.trim()) {
      notifications.error('اسم المهارة مطلوب');
      return;
    }

    try {
      setLoading(true);
      
      if (skill) {
        await technicianService.updateSkill(technicianId, skill.id, formData);
        notifications.success('تم تحديث المهارة بنجاح');
      } else {
        await technicianService.addSkill(technicianId, formData);
        notifications.success('تم إضافة المهارة بنجاح');
      }
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving skill:', error);
      notifications.error('فشل في حفظ المهارة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {skill ? 'تعديل المهارة' : 'إضافة مهارة جديدة'}
          </h2>
          <SimpleButton variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </SimpleButton>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="skillName">اسم المهارة *</Label>
            <Input
              id="skillName"
              value={formData.skillName}
              onChange={(e) => setFormData({ ...formData, skillName: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="skillLevel">مستوى المهارة</Label>
            <Select
              value={formData.skillLevel}
              onValueChange={(value) => setFormData({ ...formData, skillLevel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">مبتدئ</SelectItem>
                <SelectItem value="intermediate">متوسط</SelectItem>
                <SelectItem value="advanced">متقدم</SelectItem>
                <SelectItem value="expert">خبير</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="certification">الشهادة/الترخيص</Label>
            <Input
              id="certification"
              value={formData.certification}
              onChange={(e) => setFormData({ ...formData, certification: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="certificationDate">تاريخ الحصول</Label>
              <Input
                id="certificationDate"
                type="date"
                value={formData.certificationDate}
                onChange={(e) => setFormData({ ...formData, certificationDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="expiryDate">تاريخ الانتهاء</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">ملاحظات</Label>
            <textarea
              id="notes"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <SimpleButton type="button" variant="outline" onClick={onClose}>
              إلغاء
            </SimpleButton>
            <SimpleButton type="submit" variant="default" disabled={loading}>
              {loading ? 'جاري الحفظ...' : (skill ? 'تحديث' : 'إضافة')}
            </SimpleButton>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default TechnicianSkillForm;


