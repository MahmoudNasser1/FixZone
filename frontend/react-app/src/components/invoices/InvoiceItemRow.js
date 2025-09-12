import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import SimpleButton from '../ui/SimpleButton';
import { Edit, Trash2, Package, Wrench } from 'lucide-react';

const InvoiceItemRow = ({ 
  item, 
  index, 
  onEdit, 
  onDelete, 
  isEditable = false 
}) => {
  const { formatMoney } = useSettings();
  
  const formatCurrency = (amount, currency = 'EGP') => {
    return formatMoney(amount || 0, currency);
  };

  const getItemIcon = (itemType) => {
    return itemType === 'service' ? Wrench : Package;
  };

  const getItemTypeText = (itemType) => {
    return itemType === 'service' ? 'خدمة' : 'قطعة';
  };

  const Icon = getItemIcon(item.itemType);

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4 flex-1">
          {/* Item Icon */}
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mt-1">
            <Icon className="w-5 h-5 text-gray-600" />
          </div>

          {/* Item Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900">{item.description}</h4>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {getItemTypeText(item.itemType)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">الكمية:</span> {item.quantity}
              </div>
              <div>
                <span className="font-medium">سعر الوحدة:</span> {formatCurrency(item.unitPrice, item.currency)}
              </div>
              <div>
                <span className="font-medium">المجموع:</span> 
                <span className="font-semibold text-gray-900 ml-1">
                  {formatCurrency(item.totalPrice, item.currency)}
                </span>
              </div>
            </div>

            {/* Service/Inventory Item Reference */}
            {(item.serviceId || item.inventoryItemId) && (
              <div className="mt-2 text-xs text-gray-500">
                {item.itemType === 'service' ? (
                  <span>خدمة ID: {item.serviceId}</span>
                ) : (
                  <span>قطعة ID: {item.inventoryItemId}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isEditable && (
          <div className="flex items-center gap-2">
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={() => onEdit && onEdit(index)}
              title="تعديل"
            >
              <Edit className="w-4 h-4" />
            </SimpleButton>
            <SimpleButton
              variant="outline"
              size="sm"
              onClick={() => onDelete && onDelete(index)}
              className="text-red-600 hover:text-red-700"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </SimpleButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceItemRow;
