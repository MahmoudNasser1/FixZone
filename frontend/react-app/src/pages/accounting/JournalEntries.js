import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import apiService from '../../services/api';
import { 
  Plus, 
  Edit, 
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';

const JournalEntries = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  const fetchJournalEntries = async () => {
    try {
      const data = await apiService.request('/accounting/journal-entries');
      
      if (data.success) {
        setEntries(data.data.entries || []);
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    draft: 'مسودة',
    posted: 'مرحل',
    reversed: 'معكوس'
  };

  const statusColors = {
    draft: 'bg-yellow-100 text-yellow-800',
    posted: 'bg-green-100 text-green-800',
    reversed: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    draft: Clock,
    posted: CheckCircle,
    reversed: XCircle
  };

  const columns = [
    {
      accessorKey: 'entryNumber',
      header: 'رقم القيد',
      cell: ({ getValue }) => <span>{getValue()}</span>
    },
    {
      accessorKey: 'entryDate',
      header: 'التاريخ',
      cell: ({ getValue }) => new Date(getValue()).toLocaleDateString('ar-EG')
    },
    {
      accessorKey: 'description',
      header: 'الوصف',
      cell: ({ getValue }) => (
        <div className="max-w-xs truncate" title={getValue()}>
          {getValue()}
        </div>
      )
    },
    {
      accessorKey: 'totalDebit',
      header: 'إجمالي المدين',
      cell: ({ getValue }) => (
        <div className="text-left font-mono">
          {parseFloat(getValue()).toLocaleString()} ج.م
        </div>
      )
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ getValue }) => {
        const value = getValue();
        const Icon = statusIcons[value];
        return (
          <Badge className={statusColors[value]}>
            {Icon ? <Icon className="w-3 h-3 ml-1" /> : null}
            {statusLabels[value]}
          </Badge>
        );
      }
    }
  ];

  const actions = [
    {
      label: 'عرض',
      icon: Eye,
      onClick: (row) => console.log('View entry:', row),
      variant: 'ghost'
    },
    {
      label: 'تعديل',
      icon: Edit,
      onClick: (row) => console.log('Edit entry:', row),
      variant: 'ghost',
      condition: (row) => row.status === 'draft'
    }
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">القيود المحاسبية</h1>
          <p className="text-gray-600 mt-1">إدارة القيود المحاسبية والمعاملات المالية</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 ml-2" />
          قيد جديد
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 ml-2" />
            القيود المحاسبية
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={entries}
            columns={columns}
            actions={actions}
            loading={loading}
            emptyMessage="لا توجد قيود محاسبية"
            pagination={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalEntries;
