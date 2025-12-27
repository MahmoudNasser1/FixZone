import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Star,
  Loader2
} from 'lucide-react';
import { Button } from '../../ui/Button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/Table';
import { Card, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../ui/Dialog';
import { Label } from '../../ui/Label';
import { Input } from '../../ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/Select';
import apiService from '../../../services/apiService';

const ItemVendorsManager = ({ itemId }) => {
  const [vendors, setVendors] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [isPrimary, setIsPrimary] = useState('false'); // initialize as string for Select
  const [price, setPrice] = useState('');
  const [leadTime, setLeadTime] = useState('');

  useEffect(() => {
    if (itemId) {
      loadData();
    }
  }, [itemId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // جلب موردي الصنف
      const itemVendors = await apiService.request(`/inventory/${itemId}/vendors`);
      setVendors(itemVendors || []);

      // جلب جميع الموردين
      const allVendorsData = await apiService.request('/vendors');
      setAllVendors(allVendorsData || []);

    } catch (err) {
      console.error('Error loading vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async () => {
    try {
      if (!selectedVendor) return;

      await apiService.request(`/inventory/${itemId}/vendors`, {
        method: 'POST',
        body: JSON.stringify({
          vendorId: selectedVendor,
          isPrimary: isPrimary === 'true',
          price: parseFloat(price) || 0,
          leadTime: parseInt(leadTime) || 7
        })
      });

      setOpenDialog(false);
      setSelectedVendor('');
      setIsPrimary('false');
      setPrice('');
      setLeadTime('');
      await loadData();

    } catch (err) {
      console.error('Error adding vendor:', err);
      alert('حدث خطأ في إضافة المورد');
    }
  };

  const handleRemoveVendor = async (vendorId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المورد؟')) return;

    try {
      await apiService.request(`/inventory/${itemId}/vendors/${vendorId}`, {
        method: 'DELETE'
      });
      await loadData();
    } catch (err) {
      console.error('Error removing vendor:', err);
      alert('حدث خطأ في حذف المورد');
    }
  };

  const handleSetPrimary = async (vendorId) => {
    try {
      await apiService.request(`/inventory/${itemId}/vendors/${vendorId}/set-primary`, {
        method: 'PUT'
      });
      await loadData();
    } catch (err) {
      console.error('Error setting primary vendor:', err);
      alert('حدث خطأ في تعيين المورد الرئيسي');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">الموردون</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpenDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة مورد
        </Button>
      </div>

      {vendors.length > 0 ? (
        <Card>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell className="text-right">المورد</TableCell>
                  <TableCell className="text-right">السعر</TableCell>
                  <TableCell className="text-right">مدة التوصيل</TableCell>
                  <TableCell className="text-right">رئيسي</TableCell>
                  <TableCell className="text-right">الإجراءات</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.vendorName}</TableCell>
                    <TableCell>{parseFloat(vendor.price || 0).toFixed(2)} ج.م</TableCell>
                    <TableCell>{vendor.leadTime || 7} يوم</TableCell>
                    <TableCell>
                      {vendor.isPrimary ? (
                        <Badge variant="default" className="flex w-fit items-center gap-1">
                          <Star className="h-3 w-3 fill-current" /> رئيسي
                        </Badge>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => handleSetPrimary(vendor.vendorId)}>
                          <Star className="h-4 w-4 text-muted-foreground hover:text-yellow-400" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveVendor(vendor.vendorId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            لم يتم إضافة موردين لهذا الصنف بعد
          </CardContent>
        </Card>
      )}

      {/* Add Vendor Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>إضافة مورد للصنف</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vendor">المورد</Label>
              <Select
                value={selectedVendor}
                onValueChange={setSelectedVendor}
              >
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="اختر المورد" />
                </SelectTrigger>
                <SelectContent>
                  {allVendors
                    .filter(v => !vendors.find(iv => iv.vendorId === v.id))
                    .map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">السعر</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="leadTime">مدة التوصيل (أيام)</Label>
                <Input
                  id="leadTime"
                  type="number"
                  min="1"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  placeholder="7"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="isPrimary">مورد رئيسي؟</Label>
              <Select
                value={isPrimary}
                onValueChange={setIsPrimary}
              >
                <SelectTrigger id="isPrimary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">لا</SelectItem>
                  <SelectItem value="true">نعم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleAddVendor}
              disabled={!selectedVendor}
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemVendorsManager;
