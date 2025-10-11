import React from 'react';
import { 
  Edit, 
  Trash2, 
  Eye, 
  Package, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical
} from 'lucide-react';

/**
 * EnhancedInventoryTable Component
 * Beautiful table for displaying inventory items with enhanced features
 */
const EnhancedInventoryTable = ({ 
  items = [], 
  loading = false,
  onEdit,
  onDelete,
  onView,
  viewMode = 'list'
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getStockStatus = (item) => {
    const totalQuantity = item.totalQuantity || 0;
    const minStockLevel = item.minStockLevel || 0;
    
    if (totalQuantity === 0) {
      return {
        status: 'out_of_stock',
        label: 'نفد المخزون',
        color: 'text-red-600 bg-red-50',
        icon: XCircle
      };
    } else if (totalQuantity <= minStockLevel) {
      return {
        status: 'low_stock',
        label: 'مخزون منخفض',
        color: 'text-yellow-600 bg-yellow-50',
        icon: AlertTriangle
      };
    } else {
      return {
        status: 'in_stock',
        label: 'متوفر',
        color: 'text-green-600 bg-green-50',
        icon: CheckCircle
      };
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(price || 0);
  };

  const formatQuantity = (quantity) => {
    return new Intl.NumberFormat('ar-EG').format(quantity || 0);
  };

  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => {
            const stockStatus = getStockStatus(item);
            const StatusIcon = stockStatus.icon;
            
            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                {/* Item Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm mb-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">
                      {item.sku}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {stockStatus.label}
                    </span>
                  </div>
                </div>

                {/* Item Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">الكمية:</span>
                    <span className="font-medium">{formatQuantity(item.totalQuantity)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">سعر الشراء:</span>
                    <span className="font-medium">{formatPrice(item.purchasePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">سعر البيع:</span>
                    <span className="font-medium text-green-600">{formatPrice(item.sellingPrice)}</span>
                  </div>
                  {item.category && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">الفئة:</span>
                      <span className="font-medium">{item.category}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => onView && onView(item)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    <Eye className="h-3 w-3" />
                    عرض
                  </button>
                  <button
                    onClick={() => onEdit && onEdit(item)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    <Edit className="h-3 w-3" />
                    تعديل
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(item.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    <Trash2 className="h-3 w-3" />
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {items.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد أصناف</p>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الصنف
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الفئة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الكمية
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                سعر الشراء
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                سعر البيع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => {
              const stockStatus = getStockStatus(item);
              const StatusIcon = stockStatus.icon;
              
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500 font-mono">
                        {item.sku}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {item.category || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatQuantity(item.totalQuantity)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {formatPrice(item.purchasePrice)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-green-600">
                      {formatPrice(item.sellingPrice)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {stockStatus.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onView && onView(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEdit && onEdit(item)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete && onDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {items.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">لا توجد أصناف</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedInventoryTable;

