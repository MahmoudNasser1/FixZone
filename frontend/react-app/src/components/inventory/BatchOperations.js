import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/Dialog';
import { Button } from '../../ui/Button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/Select';
import { Label } from '../../ui/Label';
import { Input } from '../../ui/Input';
import { Alert, AlertDescription } from '../../ui/Alert';
import { Badge } from '../../ui/Badge';

const BatchOperations = ({ open, onClose, selectedItems, onExecute }) => {
  const [operation, setOperation] = useState('');
  const [updateValue, setUpdateValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!operation) return;

    setLoading(true);
    try {
      const itemIds = selectedItems.map(item => item.id);

      let payload = { itemIds };

      switch (operation) {
        case 'updatePrices':
          payload.updateData = {
            purchasePrice: parseFloat(updateValue) || 0
          };
          break;
        case 'updateCategory':
          payload.updateData = {
            category: updateValue
          };
          break;
        case 'activate':
          payload.updateData = { isActive: true };
          break;
        case 'deactivate':
          payload.updateData = { isActive: false };
          break;
        case 'delete':
          payload.action = 'delete';
          break;
        default:
          break;
      }

      await onExecute(operation, payload);
      onClose();
    } catch (error) {
      console.error('Batch operation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            عمليات جماعية
            <span className="text-sm font-normal text-muted-foreground mr-2">
              (تم اختيار {selectedItems.length} صنف)
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <Alert className="bg-blue-50 text-blue-900 border-blue-200">
            <AlertDescription>
              سيتم تطبيق العملية على جميع الأصناف المحددة
            </AlertDescription>
          </Alert>

          <div className="grid gap-2">
            <Label>نوع العملية</Label>
            <Select
              value={operation}
              onValueChange={setOperation}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر العملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatePrices">تحديث الأسعار</SelectItem>
                <SelectItem value="updateCategory">تغيير الفئة</SelectItem>
                <SelectItem value="activate">تفعيل</SelectItem>
                <SelectItem value="deactivate">تعطيل</SelectItem>
                <SelectItem value="delete">حذف</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {operation === 'updatePrices' && (
            <div className="grid gap-2">
              <Label>السعر الجديد</Label>
              <Input
                type="number"
                value={updateValue}
                onChange={(e) => setUpdateValue(e.target.value)}
                placeholder="أدخل السعر الجديد"
              />
            </div>
          )}

          {operation === 'updateCategory' && (
            <div className="grid gap-2">
              <Label>الفئة الجديدة</Label>
              <Input
                value={updateValue}
                onChange={(e) => setUpdateValue(e.target.value)}
                placeholder="أدخل اسم الفئة"
              />
            </div>
          )}

          {operation === 'delete' && (
            <Alert variant="destructive">
              <AlertDescription>
                <strong>تحذير:</strong> سيتم حذف جميع الأصناف المحددة. هذا الإجراء لا يمكن التراجع عنه.
              </AlertDescription>
            </Alert>
          )}

          {selectedItems.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">الأصناف المحددة:</p>
              <div className="flex flex-wrap gap-2">
                {selectedItems.slice(0, 5).map((item) => (
                  <Badge key={item.id} variant="secondary">
                    {item.name}
                  </Badge>
                ))}
                {selectedItems.length > 5 && (
                  <Badge variant="outline">
                    +{selectedItems.length - 5} أخرى
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={loading}>
            إلغاء
          </Button>
          <Button
            onClick={handleExecute}
            variant={operation === 'delete' ? 'destructive' : 'default'}
            disabled={!operation || loading}
          >
            {loading ? 'جاري التنفيذ...' : 'تنفيذ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchOperations;
