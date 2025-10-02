# 🔧 تنفيذ APIs قسم المالية - FixZone ERP

## 📋 نظرة عامة

هذا الملف يحتوي على تنفيذ APIs الجديدة المطلوبة لقسم المالية المتقدم في نظام FixZone ERP.

## 🛠️ Controllers الجديدة المطلوبة

### 1. CostAnalysisController.js

```javascript
const db = require('../db');

class CostAnalysisController {
  
  // حساب تكلفة صيانة محددة
  async calculateRepairCost(req, res) {
    const { repairId } = req.params;
    
    try {
      // استدعاء stored procedure لحساب التكلفة
      await db.query('CALL CalculateRepairCost(?)', [repairId]);
      
      // جلب نتائج التحليل
      const [costAnalysis] = await db.query(`
        SELECT rca.*, rr.deviceType, rr.deviceBrand, rr.deviceModel,
               c.firstName as customerFirstName, c.lastName as customerLastName
        FROM RepairCostAnalysis rca
        LEFT JOIN RepairRequest rr ON rca.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        WHERE rca.repairRequestId = ?
      `, [repairId]);
      
      res.json({
        success: true,
        data: costAnalysis[0] || null
      });
      
    } catch (error) {
      console.error('Error calculating repair cost:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to calculate repair cost',
        details: error.message 
      });
    }
  }
  
  // جلب تحليل تكلفة صيانة
  async getRepairCostAnalysis(req, res) {
    const { repairId } = req.params;
    
    try {
      const [analysis] = await db.query(`
        SELECT rca.*, rr.deviceType, rr.deviceBrand, rr.deviceModel,
               c.firstName as customerFirstName, c.lastName as customerLastName,
               u.firstName as technicianFirstName, u.lastName as technicianLastName
        FROM RepairCostAnalysis rca
        LEFT JOIN RepairRequest rr ON rca.repairRequestId = rr.id
        LEFT JOIN Customer c ON rr.customerId = c.id
        LEFT JOIN User u ON rr.assignedTechnicianId = u.id
        WHERE rca.repairRequestId = ?
      `, [repairId]);
      
      // جلب تفاصيل قطع الغيار المستخدمة
      const [partsUsed] = await db.query(`
        SELECT pu.*, ii.name as partName, ii.sku, ii.purchasePrice, ii.sellingPrice,
               pcr.profit as partProfit, pcr.profitMargin as partProfitMargin
        FROM PartsUsed pu
        LEFT JOIN InventoryItem ii ON pu.inventoryItemId = ii.id
        LEFT JOIN PartsCostRecord pcr ON pu.id = pcr.partsUsedId
        WHERE pu.repairRequestId = ?
      `, [repairId]);
      
      // جلب تفاصيل تكلفة العمل
      const [laborCosts] = await db.query(`
        SELECT lcr.*, u.firstName as technicianFirstName, u.lastName as technicianLastName
        FROM LaborCostRecord lcr
        LEFT JOIN User u ON lcr.technicianId = u.id
        WHERE lcr.repairRequestId = ?
      `, [repairId]);
      
      res.json({
        success: true,
        data: {
          analysis: analysis[0] || null,
          partsUsed: partsUsed,
          laborCosts: laborCosts
        }
      });
      
    } catch (error) {
      console.error('Error getting repair cost analysis:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get repair cost analysis',
        details: error.message 
      });
    }
  }
  
  // جلب ملخص تحليل التكاليف
  async getCostAnalysisSummary(req, res) {
    const { dateFrom, dateTo, technicianId, deviceType } = req.query;
    
    try {
      let whereConditions = [];
      let queryParams = [];
      
      if (dateFrom) {
        whereConditions.push('rca.calculatedAt >= ?');
        queryParams.push(dateFrom);
      }
      if (dateTo) {
        whereConditions.push('rca.calculatedAt <= ?');
        queryParams.push(dateTo);
      }
      if (technicianId) {
        whereConditions.push('rr.assignedTechnicianId = ?');
        queryParams.push(technicianId);
      }
      if (deviceType) {
        whereConditions.push('rr.deviceType = ?');
        queryParams.push(deviceType);
      }
      
      const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
      
      const [summary] = await db.query(`
        SELECT 
          COUNT(*) as totalRepairs,
          AVG(rca.totalCost) as averageCost,
          AVG(rca.sellingPrice) as averageSellingPrice,
          AVG(rca.profit) as averageProfit,
          AVG(rca.profitMargin) as averageProfitMargin,
          SUM(rca.partsCost) as totalPartsCost,
          SUM(rca.laborCost) as totalLaborCost,
          SUM(rca.profit) as totalProfit
        FROM RepairCostAnalysis rca
        LEFT JOIN RepairRequest rr ON rca.repairRequestId = rr.id
        ${whereClause}
      `, queryParams);
      
      // جلب أفضل الخدمات ربحية
      const [topProfitable] = await db.query(`
        SELECT 
          rr.deviceType,
          COUNT(*) as repairCount,
          AVG(rca.profitMargin) as avgProfitMargin,
          SUM(rca.profit) as totalProfit
        FROM RepairCostAnalysis rca
        LEFT JOIN RepairRequest rr ON rca.repairRequestId = rr.id
        ${whereClause}
        GROUP BY rr.deviceType
        ORDER BY avgProfitMargin DESC
        LIMIT 10
      `, queryParams);
      
      res.json({
        success: true,
        data: {
          summary: summary[0],
          topProfitableServices: topProfitable
        }
      });
      
    } catch (error) {
      console.error('Error getting cost analysis summary:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get cost analysis summary',
        details: error.message 
      });
    }
  }
}

module.exports = new CostAnalysisController();
```

### 2. FinancialReportsController.js

```javascript
const db = require('../db');

class FinancialReportsController {
  
  // تقرير الأرباح والخسائر
  async getProfitLossReport(req, res) {
    const { dateFrom, dateTo, period = 'monthly' } = req.query;
    
    try {
      let dateFormat = '%Y-%m';
      if (period === 'daily') dateFormat = '%Y-%m-%d';
      else if (period === 'yearly') dateFormat = '%Y';
      
      let whereClause = '';
      let queryParams = [];
      
      if (dateFrom && dateTo) {
        whereClause = 'WHERE i.issueDate BETWEEN ? AND ?';
        queryParams = [dateFrom, dateTo];
      }
      
      const [revenue] = await db.query(`
        SELECT 
          DATE_FORMAT(i.issueDate, '${dateFormat}') as period,
          SUM(i.finalAmount) as totalRevenue,
          SUM(i.taxAmount) as totalTax,
          COUNT(*) as invoiceCount
        FROM Invoice i
        ${whereClause}
        AND i.status = 'paid' AND i.deletedAt IS NULL
        GROUP BY DATE_FORMAT(i.issueDate, '${dateFormat}')
        ORDER BY period DESC
      `, queryParams);
      
      const [expenses] = await db.query(`
        SELECT 
          DATE_FORMAT(e.expenseDate, '${dateFormat}') as period,
          SUM(e.amount) as totalExpenses,
          COUNT(*) as expenseCount
        FROM Expense e
        ${whereClause.replace('i.issueDate', 'e.expenseDate')}
        AND e.deletedAt IS NULL
        GROUP BY DATE_FORMAT(e.expenseDate, '${dateFormat}')
        ORDER BY period DESC
      `, queryParams);
      
      // دمج البيانات
      const reportData = revenue.map(rev => {
        const expense = expenses.find(exp => exp.period === rev.period);
        return {
          period: rev.period,
          revenue: rev.totalRevenue,
          expenses: expense ? expense.totalExpenses : 0,
          grossProfit: rev.totalRevenue - (expense ? expense.totalExpenses : 0),
          netProfit: rev.totalRevenue - (expense ? expense.totalExpenses : 0),
          profitMargin: rev.totalRevenue > 0 ? 
            ((rev.totalRevenue - (expense ? expense.totalExpenses : 0)) / rev.totalRevenue) * 100 : 0
        };
      });
      
      res.json({
        success: true,
        data: reportData
      });
      
    } catch (error) {
      console.error('Error generating P&L report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate P&L report',
        details: error.message 
      });
    }
  }
  
  // تقرير التدفق النقدي
  async getCashFlowReport(req, res) {
    const { dateFrom, dateTo, period = 'monthly' } = req.query;
    
    try {
      let dateFormat = '%Y-%m';
      if (period === 'daily') dateFormat = '%Y-%m-%d';
      else if (period === 'yearly') dateFormat = '%Y';
      
      let whereClause = '';
      let queryParams = [];
      
      if (dateFrom && dateTo) {
        whereClause = 'WHERE p.paymentDate BETWEEN ? AND ?';
        queryParams = [dateFrom, dateTo];
      }
      
      // التدفق النقدي الداخل (المدفوعات)
      const [cashInflow] = await db.query(`
        SELECT 
          DATE_FORMAT(p.paymentDate, '${dateFormat}') as period,
          SUM(p.amount) as totalInflow,
          COUNT(*) as paymentCount
        FROM Payment p
        LEFT JOIN Invoice i ON p.invoiceId = i.id
        ${whereClause}
        AND i.deletedAt IS NULL
        GROUP BY DATE_FORMAT(p.paymentDate, '${dateFormat}')
        ORDER BY period DESC
      `, queryParams);
      
      // التدفق النقدي الخارج (المصروفات)
      const [cashOutflow] = await db.query(`
        SELECT 
          DATE_FORMAT(e.expenseDate, '${dateFormat}') as period,
          SUM(e.amount) as totalOutflow,
          COUNT(*) as expenseCount
        FROM Expense e
        ${whereClause.replace('p.paymentDate', 'e.expenseDate')}
        AND e.deletedAt IS NULL
        GROUP BY DATE_FORMAT(e.expenseDate, '${dateFormat}')
        ORDER BY period DESC
      `, queryParams);
      
      // دمج البيانات
      const reportData = cashInflow.map(inflow => {
        const outflow = cashOutflow.find(out => out.period === inflow.period);
        return {
          period: inflow.period,
          cashInflow: inflow.totalInflow,
          cashOutflow: outflow ? outflow.totalOutflow : 0,
          netCashFlow: inflow.totalInflow - (outflow ? outflow.totalOutflow : 0)
        };
      });
      
      res.json({
        success: true,
        data: reportData
      });
      
    } catch (error) {
      console.error('Error generating cash flow report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate cash flow report',
        details: error.message 
      });
    }
  }
  
  // تحليل ربحية الخدمات
  async getServiceProfitabilityReport(req, res) {
    const { dateFrom, dateTo } = req.query;
    
    try {
      let whereClause = '';
      let queryParams = [];
      
      if (dateFrom && dateTo) {
        whereClause = 'WHERE rca.calculatedAt BETWEEN ? AND ?';
        queryParams = [dateFrom, dateTo];
      }
      
      const [services] = await db.query(`
        SELECT 
          rr.deviceType,
          COUNT(*) as serviceCount,
          AVG(rca.totalCost) as avgCost,
          AVG(rca.sellingPrice) as avgSellingPrice,
          AVG(rca.profit) as avgProfit,
          AVG(rca.profitMargin) as avgProfitMargin,
          SUM(rca.totalCost) as totalCost,
          SUM(rca.sellingPrice) as totalRevenue,
          SUM(rca.profit) as totalProfit
        FROM RepairCostAnalysis rca
        LEFT JOIN RepairRequest rr ON rca.repairRequestId = rr.id
        ${whereClause}
        GROUP BY rr.deviceType
        ORDER BY avgProfitMargin DESC
      `, queryParams);
      
      res.json({
        success: true,
        data: services
      });
      
    } catch (error) {
      console.error('Error generating service profitability report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate service profitability report',
        details: error.message 
      });
    }
  }
  
  // تحليل العملاء
  async getCustomerAnalysisReport(req, res) {
    const { dateFrom, dateTo, limit = 20 } = req.query;
    
    try {
      let whereClause = '';
      let queryParams = [];
      
      if (dateFrom && dateTo) {
        whereClause = 'WHERE i.issueDate BETWEEN ? AND ?';
        queryParams = [dateFrom, dateTo, parseInt(limit)];
      } else {
        queryParams = [parseInt(limit)];
      }
      
      const [customers] = await db.query(`
        SELECT 
          c.id,
          c.firstName,
          c.lastName,
          c.phone,
          c.email,
          COUNT(i.id) as invoiceCount,
          SUM(i.finalAmount) as totalSpent,
          AVG(i.finalAmount) as avgInvoiceValue,
          SUM(p.amount) as totalPaid,
          (SUM(i.finalAmount) - COALESCE(SUM(p.amount), 0)) as outstandingAmount,
          MAX(i.issueDate) as lastInvoiceDate
        FROM Customer c
        LEFT JOIN Invoice i ON c.id = i.customerId AND i.deletedAt IS NULL
        LEFT JOIN Payment p ON i.id = p.invoiceId
        ${whereClause}
        GROUP BY c.id
        HAVING invoiceCount > 0
        ORDER BY totalSpent DESC
        LIMIT ?
      `, queryParams);
      
      res.json({
        success: true,
        data: customers
      });
      
    } catch (error) {
      console.error('Error generating customer analysis report:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate customer analysis report',
        details: error.message 
      });
    }
  }
}

module.exports = new FinancialReportsController();
```

### 3. TaxManagementController.js

```javascript
const db = require('../db');

class TaxManagementController {
  
  // جلب إعدادات الضرائب
  async getTaxConfigurations(req, res) {
    try {
      const [configurations] = await db.query(`
        SELECT tc.*, u.firstName as createdByFirstName, u.lastName as createdByLastName
        FROM TaxConfiguration tc
        LEFT JOIN User u ON tc.createdBy = u.id
        WHERE tc.isActive = TRUE
        ORDER BY tc.taxName
      `);
      
      res.json({
        success: true,
        data: configurations
      });
      
    } catch (error) {
      console.error('Error getting tax configurations:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to get tax configurations',
        details: error.message 
      });
    }
  }
  
  // إنشاء إعداد ضريبة جديد
  async createTaxConfiguration(req, res) {
    const { 
      taxName, 
      taxRate, 
      taxType, 
      applicableTo, 
      customRules, 
      effectiveFrom, 
      effectiveTo,
      description 
    } = req.body;
    
    const userId = req.user.id;
    
    try {
      const [result] = await db.query(`
        INSERT INTO TaxConfiguration (
          taxName, taxRate, taxType, applicableTo, customRules, 
          effectiveFrom, effectiveTo, description, createdBy
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        taxName, taxRate, taxType, applicableTo, 
        JSON.stringify(customRules), effectiveFrom, effectiveTo, 
        description, userId
      ]);
      
      res.status(201).json({
        success: true,
        data: {
          id: result.insertId,
          taxName,
          taxRate,
          taxType,
          applicableTo
        }
      });
      
    } catch (error) {
      console.error('Error creating tax configuration:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create tax configuration',
        details: error.message 
      });
    }
  }
  
  // تحديث إعداد ضريبة
  async updateTaxConfiguration(req, res) {
    const { id } = req.params;
    const { 
      taxName, 
      taxRate, 
      taxType, 
      applicableTo, 
      customRules, 
      effectiveFrom, 
      effectiveTo,
      description,
      isActive 
    } = req.body;
    
    try {
      const [result] = await db.query(`
        UPDATE TaxConfiguration 
        SET taxName = ?, taxRate = ?, taxType = ?, applicableTo = ?, 
            customRules = ?, effectiveFrom = ?, effectiveTo = ?, 
            description = ?, isActive = ?, updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        taxName, taxRate, taxType, applicableTo, 
        JSON.stringify(customRules), effectiveFrom, effectiveTo, 
        description, isActive, id
      ]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Tax configuration not found' 
        });
      }
      
      res.json({
        success: true,
        message: 'Tax configuration updated successfully'
      });
      
    } catch (error) {
      console.error('Error updating tax configuration:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update tax configuration',
        details: error.message 
      });
    }
  }
  
  // حساب الضرائب للفاتورة
  async calculateInvoiceTax(req, res) {
    const { invoiceId } = req.params;
    const { taxConfigId } = req.body;
    
    try {
      // جلب تفاصيل الفاتورة
      const [invoice] = await db.query(`
        SELECT i.*, ii.itemType, ii.totalPrice
        FROM Invoice i
        LEFT JOIN InvoiceItem ii ON i.id = ii.invoiceId
        WHERE i.id = ? AND i.deletedAt IS NULL
      `, [invoiceId]);
      
      if (invoice.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Invoice not found' 
        });
      }
      
      // جلب إعدادات الضريبة
      const [taxConfig] = await db.query(`
        SELECT * FROM TaxConfiguration 
        WHERE id = ? AND isActive = TRUE
      `, [taxConfigId]);
      
      if (taxConfig.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: 'Tax configuration not found' 
        });
      }
      
      const config = taxConfig[0];
      let taxableAmount = 0;
      
      // حساب المبلغ الخاضع للضريبة حسب النوع
      if (config.applicableTo === 'all') {
        taxableAmount = invoice[0].totalAmount;
      } else if (config.applicableTo === 'services') {
        taxableAmount = invoice
          .filter(item => item.itemType === 'service')
          .reduce((sum, item) => sum + item.totalPrice, 0);
      } else if (config.applicableTo === 'parts') {
        taxableAmount = invoice
          .filter(item => item.itemType === 'part')
          .reduce((sum, item) => sum + item.totalPrice, 0);
      }
      
      const taxAmount = (taxableAmount * config.taxRate) / 100;
      
      // تحديث الفاتورة بالضريبة
      await db.query(`
        UPDATE Invoice 
        SET taxAmount = ?, taxConfigurationId = ?, finalAmount = totalAmount + ?
        WHERE id = ?
      `, [taxAmount, config.id, taxAmount, invoiceId]);
      
      res.json({
        success: true,
        data: {
          taxableAmount,
          taxRate: config.taxRate,
          taxAmount,
          finalAmount: invoice[0].totalAmount + taxAmount
        }
      });
      
    } catch (error) {
      console.error('Error calculating invoice tax:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to calculate invoice tax',
        details: error.message 
      });
    }
  }
  
  // تقارير الضرائب
  async getTaxReports(req, res) {
    const { dateFrom, dateTo, taxType } = req.query;
    
    try {
      let whereClause = 'WHERE i.deletedAt IS NULL AND i.taxAmount > 0';
      let queryParams = [];
      
      if (dateFrom && dateTo) {
        whereClause += ' AND i.issueDate BETWEEN ? AND ?';
        queryParams.push(dateFrom, dateTo);
      }
      
      if (taxType) {
        whereClause += ' AND tc.taxType = ?';
        queryParams.push(taxType);
      }
      
      const [taxSummary] = await db.query(`
        SELECT 
          tc.taxName,
          tc.taxType,
          tc.taxRate,
          COUNT(i.id) as invoiceCount,
          SUM(i.taxAmount) as totalTaxCollected,
          SUM(i.finalAmount) as totalAmount
        FROM Invoice i
        LEFT JOIN TaxConfiguration tc ON i.taxConfigurationId = tc.id
        ${whereClause}
        GROUP BY tc.id
        ORDER BY totalTaxCollected DESC
      `, queryParams);
      
      const [monthlyTax] = await db.query(`
        SELECT 
          DATE_FORMAT(i.issueDate, '%Y-%m') as month,
          tc.taxName,
          SUM(i.taxAmount) as monthlyTax
        FROM Invoice i
        LEFT JOIN TaxConfiguration tc ON i.taxConfigurationId = tc.id
        ${whereClause}
        GROUP BY DATE_FORMAT(i.issueDate, '%Y-%m'), tc.id
        ORDER BY month DESC
      `, queryParams);
      
      res.json({
        success: true,
        data: {
          summary: taxSummary,
          monthlyBreakdown: monthlyTax
        }
      });
      
    } catch (error) {
      console.error('Error generating tax reports:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to generate tax reports',
        details: error.message 
      });
    }
  }
}

module.exports = new TaxManagementController();
```

## 🛣️ Routes الجديدة

### 1. costAnalysis.js

```javascript
const express = require('express');
const router = express.Router();
const costAnalysisController = require('../controllers/CostAnalysisController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// حساب تكلفة صيانة
router.post('/calculate/:repairId', costAnalysisController.calculateRepairCost);

// جلب تحليل تكلفة صيانة
router.get('/repair/:repairId', costAnalysisController.getRepairCostAnalysis);

// جلب ملخص تحليل التكاليف
router.get('/summary', costAnalysisController.getCostAnalysisSummary);

module.exports = router;
```

### 2. financialReports.js

```javascript
const express = require('express');
const router = express.Router();
const financialReportsController = require('../controllers/FinancialReportsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// تقرير الأرباح والخسائر
router.get('/pl', financialReportsController.getProfitLossReport);

// تقرير التدفق النقدي
router.get('/cashflow', financialReportsController.getCashFlowReport);

// تحليل ربحية الخدمات
router.get('/profitability', financialReportsController.getServiceProfitabilityReport);

// تحليل العملاء
router.get('/customer-analysis', financialReportsController.getCustomerAnalysisReport);

module.exports = router;
```

### 3. taxManagement.js

```javascript
const express = require('express');
const router = express.Router();
const taxManagementController = require('../controllers/TaxManagementController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// جلب إعدادات الضرائب
router.get('/config', taxManagementController.getTaxConfigurations);

// إنشاء إعداد ضريبة جديد
router.post('/config', taxManagementController.createTaxConfiguration);

// تحديث إعداد ضريبة
router.put('/config/:id', taxManagementController.updateTaxConfiguration);

// حساب الضرائب للفاتورة
router.post('/calculate/:invoiceId', taxManagementController.calculateInvoiceTax);

// تقارير الضرائب
router.get('/reports', taxManagementController.getTaxReports);

module.exports = router;
```

## 📱 Frontend Components الجديدة

### 1. CostAnalysisPage.js

```javascript
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown, Calculator } from 'lucide-react';

const CostAnalysisPage = () => {
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [repairId, setRepairId] = useState('');

  const calculateCost = async () => {
    if (!repairId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/finance/cost-analysis/calculate/${repairId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      if (data.success) {
        setCostData(data.data);
      }
    } catch (error) {
      console.error('Error calculating cost:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">تحليل تكلفة الصيانة</h1>
        <div className="flex gap-2">
          <Input
            placeholder="رقم طلب الإصلاح"
            value={repairId}
            onChange={(e) => setRepairId(e.target.value)}
            className="w-48"
          />
          <Button onClick={calculateCost} disabled={loading}>
            <Calculator className="w-4 h-4 mr-2" />
            حساب التكلفة
          </Button>
        </div>
      </div>

      {costData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي التكلفة</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{costData.totalCost} جنيه</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">سعر البيع</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{costData.sellingPrice} جنيه</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الربح</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{costData.profit} جنيه</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{costData.profitMargin}%</div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CostAnalysisPage;
```

### 2. FinancialReportsPage.js

```javascript
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FinancialReportsPage = () => {
  const [reports, setReports] = useState({
    pl: [],
    cashflow: [],
    profitability: []
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: '',
    to: ''
  });

  const generateReport = async (type) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dateFrom: dateRange.from,
        dateTo: dateRange.to,
        period: 'monthly'
      });
      
      const response = await fetch(`/api/finance/reports/${type}?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setReports(prev => ({ ...prev, [type]: data.data }));
      }
    } catch (error) {
      console.error(`Error generating ${type} report:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">التقارير المالية</h1>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
          />
          <Input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
          />
          <Button onClick={() => {
            generateReport('pl');
            generateReport('cashflow');
            generateReport('profitability');
          }} disabled={loading}>
            توليد التقارير
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pl" className="w-full">
        <TabsList>
          <TabsTrigger value="pl">الأرباح والخسائر</TabsTrigger>
          <TabsTrigger value="cashflow">التدفق النقدي</TabsTrigger>
          <TabsTrigger value="profitability">ربحية الخدمات</TabsTrigger>
        </TabsList>

        <TabsContent value="pl">
          <Card>
            <CardHeader>
              <CardTitle>تقرير الأرباح والخسائر</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.pl.length > 0 && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reports.pl}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#22c55e" name="الإيرادات" />
                    <Bar dataKey="expenses" fill="#ef4444" name="المصروفات" />
                    <Bar dataKey="netProfit" fill="#3b82f6" name="صافي الربح" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cashflow">
          <Card>
            <CardHeader>
              <CardTitle>تقرير التدفق النقدي</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.cashflow.length > 0 && (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={reports.cashflow}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cashInflow" fill="#22c55e" name="التدفق الداخل" />
                    <Bar dataKey="cashOutflow" fill="#ef4444" name="التدفق الخارج" />
                    <Bar dataKey="netCashFlow" fill="#3b82f6" name="صافي التدفق" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profitability">
          <Card>
            <CardHeader>
              <CardTitle>تحليل ربحية الخدمات</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.profitability.length > 0 && (
                <div className="space-y-4">
                  {reports.profitability.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{service.deviceType}</h3>
                        <p className="text-sm text-gray-600">
                          {service.serviceCount} خدمة - متوسط الربح: {service.avgProfit} جنيه
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{service.avgProfitMargin}%</div>
                        <div className="text-sm text-gray-600">هامش الربح</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReportsPage;
```

## 🔗 تحديث app.js لإضافة Routes الجديدة

```javascript
// إضافة هذه السطور في app.js
const costAnalysisRoutes = require('./routes/costAnalysis');
const financialReportsRoutes = require('./routes/financialReports');
const taxManagementRoutes = require('./routes/taxManagement');

// استخدام الـ routes
app.use('/api/finance/cost-analysis', costAnalysisRoutes);
app.use('/api/finance/reports', financialReportsRoutes);
app.use('/api/finance/tax', taxManagementRoutes);
```

---

*هذا الملف يحتوي على تنفيذ كامل للـ APIs الجديدة المطلوبة لقسم المالية المتقدم، مع أمثلة على واجهات المستخدم والتكامل مع النظام الحالي.*
