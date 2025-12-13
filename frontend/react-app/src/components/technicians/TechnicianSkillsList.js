import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Award, CheckCircle } from 'lucide-react';
import { useNotifications } from '../notifications/NotificationSystem';
import technicianService from '../../services/technicianService';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from '../ui/SimpleCard';
import SimpleButton from '../ui/SimpleButton';
import SimpleBadge from '../ui/SimpleBadge';
import TechnicianSkillForm from './TechnicianSkillForm';
import LoadingSpinner from '../ui/LoadingSpinner';

const TechnicianSkillsList = ({ technicianId }) => {
  const notifications = useNotifications();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);

  useEffect(() => {
    if (technicianId) {
      loadSkills();
    }
  }, [technicianId]);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const response = await technicianService.getTechnicianSkills(technicianId);
      if (response.success && response.data) {
        setSkills(response.data);
      }
    } catch (error) {
      console.error('Error loading skills:', error);
      notifications.error('خطأ في تحميل المهارات');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingSkill(null);
    setIsFormOpen(true);
  };

  const handleEdit = (skill) => {
    setEditingSkill(skill);
    setIsFormOpen(true);
  };

  const handleDelete = async (skill) => {
    if (!window.confirm(`هل أنت متأكد من حذف المهارة "${skill.skillName}"؟`)) {
      return;
    }

    try {
      await technicianService.deleteSkill(technicianId, skill.id);
      notifications.success('تم حذف المهارة بنجاح');
      loadSkills();
    } catch (error) {
      console.error('Error deleting skill:', error);
      notifications.error('فشل في حذف المهارة');
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingSkill(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadSkills();
  };

  const getSkillLevelBadge = (level) => {
    const levels = {
      beginner: { label: 'مبتدئ', color: 'gray' },
      intermediate: { label: 'متوسط', color: 'blue' },
      advanced: { label: 'متقدم', color: 'green' },
      expert: { label: 'خبير', color: 'purple' }
    };
    return levels[level] || levels.intermediate;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">المهارات</h3>
        <SimpleButton onClick={handleAdd} variant="default" size="sm">
          <Plus className="w-4 h-4 ml-2" />
          إضافة مهارة
        </SimpleButton>
      </div>

      {skills.length === 0 ? (
        <SimpleCard>
          <SimpleCardContent className="p-8 text-center">
            <Award className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">لا توجد مهارات مسجلة</p>
            <SimpleButton onClick={handleAdd} variant="outline" className="mt-4">
              إضافة مهارة أولى
            </SimpleButton>
          </SimpleCardContent>
        </SimpleCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skills.map((skill) => (
            <SimpleCard key={skill.id}>
              <SimpleCardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">{skill.skillName}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <SimpleBadge color={getSkillLevelBadge(skill.skillLevel).color}>
                        {getSkillLevelBadge(skill.skillLevel).label}
                      </SimpleBadge>
                      {skill.verifiedBy && (
                        <SimpleBadge color="green" variant="outline">
                          <CheckCircle className="w-3 h-3 ml-1" />
                          مُتحقق
                        </SimpleBadge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <SimpleButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(skill)}
                    >
                      <Edit className="w-4 h-4" />
                    </SimpleButton>
                    <SimpleButton
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(skill)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </SimpleButton>
                  </div>
                </div>
                
                {skill.certification && (
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>الشهادة:</strong> {skill.certification}
                  </div>
                )}
                
                {skill.certificationDate && (
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>تاريخ الحصول:</strong> {new Date(skill.certificationDate).toLocaleDateString('ar-EG')}
                  </div>
                )}
                
                {skill.expiryDate && (
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>تاريخ الانتهاء:</strong> {new Date(skill.expiryDate).toLocaleDateString('ar-EG')}
                  </div>
                )}
                
                {skill.notes && (
                  <div className="text-sm text-gray-600">
                    <strong>ملاحظات:</strong> {skill.notes}
                  </div>
                )}
              </SimpleCardContent>
            </SimpleCard>
          ))}
        </div>
      )}

      {isFormOpen && (
        <TechnicianSkillForm
          technicianId={technicianId}
          skill={editingSkill}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default TechnicianSkillsList;


