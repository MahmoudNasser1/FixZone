import React, { useState, useEffect } from 'react';
import { SimpleCard, SimpleCardHeader, SimpleCardTitle, SimpleCardContent } from './SimpleCard';
import SimpleBadge from './SimpleBadge';
import SimpleButton from './SimpleButton';
import { ArrowUpDown, Package, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';

const StockMovementHistory = ({ inventoryItemId, onClose }) => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (inventoryItemId) {
      loadMovements();
    }
  }, [inventoryItemId]);

  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);
      // استدعاء API لجلب حركات المخزون
              const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:4000/api'}/stockmovements?inventoryItemId=${inventoryItemId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setMovements(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading stock movements:', e);
      setError(e?.message || 'تعذر تحميل تاريخ حركات المخزون');
    } finally {
      setLoading(false);
    }
  };

  const getMovementIcon = (type) => {
    switch (type) {
      case 'IN':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'OUT':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'TRANSFER':
        return <ArrowUpDown className="w-4 h-4 text-blue-600" />;
      case 'ADJUSTMENT':
        return <RotateCcw className="w-4 h-4 text-orange-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMovementColor = (type) => {
    switch (type) {
      case 'IN':
        return 'bg-green-100 text-green-800';
      case 'OUT':
        return 'bg-red-100 text-red-800';
      case 'TRANSFER':
        return 'bg-blue-100 text-blue-800';
      case 'ADJUSTMENT':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMovementLabel = (type) => {
    switch (type) {
      case 'IN':
        return 'وارد';
      case 'OUT':
        return 'صادر';
      case 'TRANSFER':
        return 'نقل';
      case 'ADJUSTMENT':
        return 'تسوية';
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <SimpleCard>
      <SimpleCardHeader>
        <div className="flex items-center justify-between">
          <SimpleCardTitle className="flex items-center">
            <Package className="w-5 h-5 ml-2" />
            تاريخ حركات المخزون
          </SimpleCardTitle>
          {onClose && (
            <SimpleButton variant="outline" size="sm" onClick={onClose}>
              إغلاق
            </SimpleButton>
          )}
        </div>
      </SimpleCardHeader>
      <SimpleCardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>لا توجد حركات مخزون مسجلة لهذا العنصر</p>
          </div>
        ) : (
          <div className="space-y-4">
            {movements.map((movement) => (
              <div key={movement.id} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  {getMovementIcon(movement.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <SimpleBadge className={getMovementColor(movement.type)}>
                      {getMovementLabel(movement.type)}
                    </SimpleBadge>
                    <span className="text-sm text-gray-500">
                      {formatDate(movement.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-900">
                    <span className="font-medium">الكمية: {movement.quantity}</span>
                    {movement.fromWarehouseName && (
                      <span className="mx-2 text-gray-500">
                        من: {movement.fromWarehouseName}
                      </span>
                    )}
                    {movement.toWarehouseName && (
                      <span className="mx-2 text-gray-500">
                        إلى: {movement.toWarehouseName}
                      </span>
                    )}
                  </div>
                  {movement.notes && (
                    <p className="text-xs text-gray-600 mt-1">{movement.notes}</p>
                  )}
                  {movement.userName && (
                    <p className="text-xs text-gray-500 mt-1">
                      بواسطة: {movement.userName}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </SimpleCardContent>
    </SimpleCard>
  );
};

export default StockMovementHistory;
