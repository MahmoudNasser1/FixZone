import React, { useState, useEffect } from 'react';
import { Star, User, Calendar } from 'lucide-react';
import { useNotifications } from '../notifications/NotificationSystem';
import technicianService from '../../services/technicianService';
import { SimpleCard, SimpleCardContent } from '../ui/SimpleCard';
import SimpleBadge from '../ui/SimpleBadge';
import LoadingSpinner from '../ui/LoadingSpinner';

const TechnicianEvaluationsList = ({ technicianId }) => {
  const notifications = useNotifications();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (technicianId) {
      loadEvaluations();
    }
  }, [technicianId]);

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const response = await technicianService.getTechnicianEvaluations(technicianId);
      if (response.success && response.data) {
        setEvaluations(response.data);
      }
    } catch (error) {
      console.error('Error loading evaluations:', error);
      notifications.error('خطأ في تحميل التقييمات');
    } finally {
      setLoading(false);
    }
  };

  const getEvaluationTypeLabel = (type) => {
    const types = {
      supervisor: 'مشرف',
      customer: 'عميل',
      system: 'نظام'
    };
    return types[type] || type;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">التقييمات</h3>

      {evaluations.length === 0 ? (
        <SimpleCard>
          <SimpleCardContent className="p-8 text-center">
            <Star className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">لا توجد تقييمات</p>
          </SimpleCardContent>
        </SimpleCard>
      ) : (
        <div className="space-y-3">
          {evaluations.map((evaluation) => (
            <SimpleCard key={evaluation.id}>
              <SimpleCardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xl font-bold">{evaluation.overallScore?.toFixed(1) || '0.0'}</span>
                    <SimpleBadge color="blue">{getEvaluationTypeLabel(evaluation.evaluationType)}</SimpleBadge>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(evaluation.evaluationDate).toLocaleDateString('ar-EG')}
                  </span>
                </div>
                {evaluation.evaluatedByName && (
                  <p className="text-sm text-gray-600 mb-2">من: {evaluation.evaluatedByName}</p>
                )}
                {evaluation.comments && (
                  <p className="text-sm text-gray-700">{evaluation.comments}</p>
                )}
              </SimpleCardContent>
            </SimpleCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicianEvaluationsList;

