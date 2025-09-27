import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { Calculator, Percent, DollarSign, Info } from 'lucide-react';

const TaxCalculator = ({ 
  subtotal = 0, 
  taxRate = 15, 
  onTaxChange,
  currency = 'EGP',
  showDetails = true 
}) => {
  const { formatMoney } = useSettings();
  const [localTaxRate, setLocalTaxRate] = useState(taxRate);
  const [taxAmount, setTaxAmount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const calculatedTax = (subtotal * localTaxRate) / 100;
    const calculatedTotal = subtotal + calculatedTax;
    
    setTaxAmount(calculatedTax);
    setTotal(calculatedTotal);
    
    if (onTaxChange) {
      onTaxChange({
        taxRate: localTaxRate,
        taxAmount: calculatedTax,
        total: calculatedTotal
      });
    }
  }, [subtotal, localTaxRate, onTaxChange]);

  const formatCurrency = (amount) => {
    return formatMoney(amount || 0, currency);
  };

  const handleTaxRateChange = (e) => {
    const newRate = parseFloat(e.target.value) || 0;
    setLocalTaxRate(newRate);
  };

  const presetRates = [
    { label: 'بدون ضريبة', value: 0 },
    { label: '5%', value: 5 },
    { label: '10%', value: 10 },
    { label: '15%', value: 15 },
    { label: '20%', value: 20 }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">حاسبة الضرائب</h3>
      </div>

      {/* Tax Rate Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          معدل الضريبة (%)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localTaxRate}
            onChange={handleTaxRateChange}
            min="0"
            max="100"
            step="0.1"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Percent className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Preset Rates */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          معدلات سريعة
        </label>
        <div className="flex flex-wrap gap-2">
          {presetRates.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setLocalTaxRate(preset.value)}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                localTaxRate === preset.value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Calculation Details */}
      {showDetails && (
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600">المجموع الفرعي:</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">الضريبة ({localTaxRate}%):</span>
              <Info className="w-4 h-4 text-gray-400" title={`${localTaxRate}% من ${formatCurrency(subtotal)}`} />
            </div>
            <span className="font-semibold text-blue-600">{formatCurrency(taxAmount)}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 bg-gray-50 rounded-lg px-3">
            <span className="text-lg font-semibold text-gray-900">المجموع الإجمالي:</span>
            <span className="text-lg font-bold text-green-600">{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {/* Tax Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">معلومات الضريبة:</p>
            <ul className="text-xs space-y-1">
              <li>• الضريبة المضافة: {localTaxRate}%</li>
              <li>• المبلغ الخاضع للضريبة: {formatCurrency(subtotal)}</li>
              <li>• مبلغ الضريبة: {formatCurrency(taxAmount)}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxCalculator;
