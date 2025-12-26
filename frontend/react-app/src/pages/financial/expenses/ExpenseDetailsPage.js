// Expense Details Page
// Page for viewing expense details

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { SimpleCard, SimpleCardContent, SimpleCardHeader } from '../../../components/ui/SimpleCard';
import SimpleButton from '../../../components/ui/SimpleButton';
import SimpleBadge from '../../../components/ui/SimpleBadge';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import { ConfirmModal } from '../../../components/ui/Modal';
import { useExpenses } from '../../../hooks/financial/useExpenses';
import expensesService from '../../../services/financial/expensesService';

const ExpenseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteExpense } = useExpenses();

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true);
        const response = await expensesService.getById(id);
        if (response.success) {
          setExpense(response.data);
        }
      } catch (error) {
        console.error('Error fetching expense:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchExpense();
    }
  }, [id]);

  const handleEdit = () => {
    navigate(`/financial/expenses/${id}/edit`);
  };

  const handleDelete = async () => {
    try {
      await deleteExpense(id);
      navigate('/financial/expenses');
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ar-EG');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="min-h-screen bg-background p-6">
        <SimpleCard>
          <SimpleCardContent className="p-6">
            <p className="text-destructive mb-4">النفقة غير موجودة</p>
            <SimpleButton onClick={() => navigate('/financial/expenses')}>
              رجوع
            </SimpleButton>
          </SimpleCardContent>
        </SimpleCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <SimpleButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/financial/expenses')}
            >
              <ArrowLeft className="w-4 h-4 ml-2" />
              رجوع
            </SimpleButton>
            <h1 className="text-3xl font-bold text-foreground">
              نفقة #{expense.id}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4 ml-2" />
              تعديل
            </SimpleButton>
            <SimpleButton
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 className="w-4 h-4 ml-2" />
              حذف
            </SimpleButton>
          </div>
        </div>

        {/* Expense Info */}
        <SimpleCard>
          <SimpleCardHeader>
            <h2 className="text-xl font-semibold text-foreground">معلومات النفقة</h2>
          </SimpleCardHeader>
          <SimpleCardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">المبلغ</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(expense.amount)}
                </p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">التصنيف</p>
                <SimpleBadge variant="default" className="mt-1">
                  {expense.categoryName || '-'}
                </SimpleBadge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">التاريخ</p>
                <p className="text-foreground">
                  {formatDate(expense.expenseDate || expense.date)}
                </p>
              </div>

              {expense.branchName && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">الفرع</p>
                  <p className="text-foreground">{expense.branchName}</p>
                </div>
              )}

              {expense.vendorName && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">المورد</p>
                  <p className="text-foreground">{expense.vendorName}</p>
                </div>
              )}

              <div className="sm:col-span-2">
                <p className="text-sm text-muted-foreground mb-1">الوصف</p>
                <p className="text-foreground">{expense.description || '-'}</p>
              </div>

              {expense.createdByName && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">تم الإنشاء بواسطة</p>
                  <p className="text-foreground">{expense.createdByName}</p>
                </div>
              )}

              {expense.createdAt && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">تاريخ الإنشاء</p>
                  <p className="text-foreground">{formatDate(expense.createdAt)}</p>
                </div>
              )}
            </div>
          </SimpleCardContent>
        </SimpleCard>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="تأكيد الحذف"
          message="هل أنت متأكد من حذف هذه النفقة؟ لا يمكن التراجع عن هذا الإجراء."
          confirmText="حذف"
          cancelText="إلغاء"
          variant="danger"
        />
      </div>
    </div>
  );
};

export default ExpenseDetailsPage;
