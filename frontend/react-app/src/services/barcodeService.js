import apiService from './api';

/**
 * Barcode Service
 * Handles all barcode-related API calls
 */

const barcodeService = {
  // توليد باركود للصنف
  generateBarcode: async (inventoryItemId, barcodeType = 'CODE128') => {
    return apiService.post('/barcode/generate', { inventoryItemId, barcodeType });
  },

  // مسح باركود
  scanBarcode: async (barcode, scanType = 'lookup', warehouseId = null, scannedBy = null) => {
    return apiService.post('/barcode/scan', {
      barcode,
      scanType,
      warehouseId,
      scannedBy
    });
  },

  // البحث بالباركود
  getItemByBarcode: async (barcode) => {
    return apiService.get(`/barcode/item/${barcode}`);
  },

  // مسح متعدد
  batchScan: async (barcodes, scanType = 'lookup', warehouseId = null, scannedBy = null) => {
    return apiService.post('/barcode/batch-scan', {
      barcodes,
      scanType,
      warehouseId,
      scannedBy
    });
  },

  // سجل المسح
  getScanHistory: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    if (filters.scanType) params.append('scanType', filters.scanType);
    if (filters.result) params.append('result', filters.result);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    return apiService.get(`/barcode/history?${params.toString()}`);
  },

  // إحصائيات المسح
  getScanStats: async () => {
    return apiService.get('/barcode/stats');
  }
};

export default barcodeService;

