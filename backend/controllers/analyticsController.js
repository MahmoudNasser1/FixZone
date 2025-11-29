const db = require('../db');
const SettingsIntegration = require('../utils/settingsIntegration');

class AnalyticsController {
  // 1. تحليل قيمة المخزون
  async getInventoryValue(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      // إجمالي قيمة المخزون
      const [totalValueResult] = await db.execute(`
        SELECT 
          SUM(sl.quantity * ii.purchasePrice) as totalPurchaseValue,
          SUM(sl.quantity * ii.sellingPrice) as totalSellingValue,
          SUM(sl.quantity) as totalQuantity,
          COUNT(DISTINCT ii.id) as totalItems
        FROM StockLevel sl
        JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
        WHERE ii.deletedAt IS NULL
      `);

      // التوزيع حسب الفئة
      const [categoryBreakdown] = await db.execute(`
        SELECT 
          ii.type as category,
          SUM(sl.quantity * ii.purchasePrice) as purchaseValue,
          SUM(sl.quantity * ii.sellingPrice) as sellingValue,
          SUM(sl.quantity) as quantity,
          COUNT(DISTINCT ii.id) as itemCount
        FROM StockLevel sl
        JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
        WHERE ii.deletedAt IS NULL
        GROUP BY ii.type
        ORDER BY purchaseValue DESC
      `);

      // التوزيع حسب المستودع
      const [warehouseBreakdown] = await db.execute(`
        SELECT 
          w.id,
          w.name as warehouseName,
          SUM(sl.quantity * ii.purchasePrice) as purchaseValue,
          SUM(sl.quantity * ii.sellingPrice) as sellingValue,
          SUM(sl.quantity) as quantity,
          COUNT(DISTINCT ii.id) as itemCount
        FROM StockLevel sl
        JOIN InventoryItem ii ON sl.inventoryItemId = ii.id
        JOIN Warehouse w ON sl.warehouseId = w.id
        WHERE ii.deletedAt IS NULL AND w.deletedAt IS NULL
        GROUP BY w.id, w.name
        ORDER BY purchaseValue DESC
      `);

      // هامش الربح المتوقع
      const totalValue = totalValueResult[0];
      const potentialProfit = parseFloat(totalValue.totalSellingValue || 0) - 
                              parseFloat(totalValue.totalPurchaseValue || 0);
      const profitMargin = totalValue.totalPurchaseValue > 0 
        ? ((potentialProfit / parseFloat(totalValue.totalPurchaseValue)) * 100).toFixed(2)
        : 0;

      // Get currency settings for value formatting
      const currencySettings = await SettingsIntegration.getCurrencySettings();

      res.json({
        success: true,
        data: {
          totalValue: {
            purchaseValue: parseFloat(totalValue.totalPurchaseValue || 0),
            sellingValue: parseFloat(totalValue.totalSellingValue || 0),
            potentialProfit,
            profitMargin: parseFloat(profitMargin),
            totalQuantity: parseInt(totalValue.totalQuantity || 0),
            totalItems: parseInt(totalValue.totalItems || 0)
          },
          categoryBreakdown: categoryBreakdown.map(cat => ({
            category: cat.category,
            purchaseValue: parseFloat(cat.purchaseValue || 0),
            sellingValue: parseFloat(cat.sellingValue || 0),
            quantity: parseInt(cat.quantity || 0),
            itemCount: parseInt(cat.itemCount || 0)
          })),
          warehouseBreakdown: warehouseBreakdown.map(wh => ({
            id: wh.id,
            name: wh.warehouseName,
            purchaseValue: parseFloat(wh.purchaseValue || 0),
            sellingValue: parseFloat(wh.sellingValue || 0),
            quantity: parseInt(wh.quantity || 0),
            itemCount: parseInt(wh.itemCount || 0)
          })),
          // Include settings for frontend
          settings: {
            currency: currencySettings
          }
        }
      });
    } catch (error) {
      console.error('Error getting inventory value:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب قيمة المخزون',
        details: error.message
      });
    }
  }

  // 2. معدل الدوران (Turnover Rate)
  async getTurnoverRate(req, res) {
    try {
      const { period = 30 } = req.query; // آخر 30 يوم افتراضياً

      // حساب معدل الدوران الإجمالي
      const [overallTurnover] = await db.execute(`
        SELECT 
          SUM(ABS(sm.quantity)) as totalMovement,
          AVG(sl.quantity) as avgStockLevel,
          (SUM(ABS(sm.quantity)) / NULLIF(AVG(sl.quantity), 0)) as turnoverRate
        FROM StockMovement sm
        JOIN StockLevel sl ON sm.inventoryItemId = sl.inventoryItemId
        WHERE sm.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
      `, [period]);

      // معدل الدوران حسب الفئة
      const [categoryTurnover] = await db.execute(`
        SELECT 
          ii.type as category,
          SUM(ABS(sm.quantity)) as totalMovement,
          AVG(sl.quantity) as avgStockLevel,
          (SUM(ABS(sm.quantity)) / NULLIF(AVG(sl.quantity), 0)) as turnoverRate,
          COUNT(DISTINCT ii.id) as itemCount
        FROM StockMovement sm
        JOIN InventoryItem ii ON sm.inventoryItemId = ii.id
        JOIN StockLevel sl ON sm.inventoryItemId = sl.inventoryItemId
        WHERE sm.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND ii.deletedAt IS NULL
        GROUP BY ii.type
        ORDER BY turnoverRate DESC
      `, [period]);

      // الأصناف الأسرع حركة
      const [fastMoving] = await db.execute(`
        SELECT 
          ii.id,
          ii.name,
          ii.type as category,
          SUM(ABS(sm.quantity)) as totalMovement,
          AVG(sl.quantity) as avgStockLevel,
          (SUM(ABS(sm.quantity)) / NULLIF(AVG(sl.quantity), 0)) as turnoverRate
        FROM StockMovement sm
        JOIN InventoryItem ii ON sm.inventoryItemId = ii.id
        JOIN StockLevel sl ON sm.inventoryItemId = sl.inventoryItemId
        WHERE sm.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND ii.deletedAt IS NULL
        GROUP BY ii.id, ii.name, ii.type
        HAVING turnoverRate > 1
        ORDER BY turnoverRate DESC
        LIMIT 10
      `, [period]);

      // الأصناف الأبطأ حركة
      const [slowMoving] = await db.execute(`
        SELECT 
          ii.id,
          ii.name,
          ii.type as category,
          SUM(ABS(sm.quantity)) as totalMovement,
          AVG(sl.quantity) as avgStockLevel,
          (SUM(ABS(sm.quantity)) / NULLIF(AVG(sl.quantity), 0)) as turnoverRate
        FROM StockMovement sm
        JOIN InventoryItem ii ON sm.inventoryItemId = ii.id
        JOIN StockLevel sl ON sm.inventoryItemId = sl.inventoryItemId
        WHERE sm.createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
          AND ii.deletedAt IS NULL
        GROUP BY ii.id, ii.name, ii.type
        HAVING turnoverRate < 0.5 OR turnoverRate IS NULL
        ORDER BY turnoverRate ASC
        LIMIT 10
      `, [period]);

      res.json({
        success: true,
        data: {
          period,
          overall: {
            totalMovement: parseInt(overallTurnover[0]?.totalMovement || 0),
            avgStockLevel: parseFloat(overallTurnover[0]?.avgStockLevel || 0),
            turnoverRate: parseFloat(overallTurnover[0]?.turnoverRate || 0)
          },
          byCategory: categoryTurnover.map(cat => ({
            category: cat.category,
            totalMovement: parseInt(cat.totalMovement || 0),
            avgStockLevel: parseFloat(cat.avgStockLevel || 0),
            turnoverRate: parseFloat(cat.turnoverRate || 0),
            itemCount: parseInt(cat.itemCount || 0)
          })),
          fastMoving: fastMoving.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            totalMovement: parseInt(item.totalMovement || 0),
            avgStockLevel: parseFloat(item.avgStockLevel || 0),
            turnoverRate: parseFloat(item.turnoverRate || 0)
          })),
          slowMoving: slowMoving.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            totalMovement: parseInt(item.totalMovement || 0),
            avgStockLevel: parseFloat(item.avgStockLevel || 0),
            turnoverRate: parseFloat(item.turnoverRate || 0)
          }))
        }
      });
    } catch (error) {
      console.error('Error getting turnover rate:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في حساب معدل الدوران',
        details: error.message
      });
    }
  }

  // 3. تحليل ABC
  async getABCAnalysis(req, res) {
    try {
      // الحصول على جميع الأصناف مع قيمتها
      const [items] = await db.execute(`
        SELECT 
          ii.id,
          ii.name,
          ii.type as category,
          SUM(sl.quantity) as totalQuantity,
          ii.purchasePrice,
          ii.sellingPrice,
          (SUM(sl.quantity) * ii.sellingPrice) as totalValue
        FROM InventoryItem ii
        JOIN StockLevel sl ON ii.id = sl.inventoryItemId
        WHERE ii.deletedAt IS NULL
        GROUP BY ii.id, ii.name, ii.type, ii.purchasePrice, ii.sellingPrice
        ORDER BY totalValue DESC
      `);

      // حساب ABC classification
      const totalValue = items.reduce((sum, item) => sum + parseFloat(item.totalValue || 0), 0);
      let cumulativeValue = 0;
      let cumulativePercentage = 0;

      const classifiedItems = items.map(item => {
        const itemValue = parseFloat(item.totalValue || 0);
        cumulativeValue += itemValue;
        cumulativePercentage = (cumulativeValue / totalValue) * 100;

        let classification;
        if (cumulativePercentage <= 80) {
          classification = 'A'; // 80% من القيمة
        } else if (cumulativePercentage <= 95) {
          classification = 'B'; // 15% من القيمة
        } else {
          classification = 'C'; // 5% من القيمة
        }

        return {
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: parseInt(item.totalQuantity || 0),
          purchasePrice: parseFloat(item.purchasePrice || 0),
          sellingPrice: parseFloat(item.sellingPrice || 0),
          totalValue: itemValue,
          valuePercentage: ((itemValue / totalValue) * 100).toFixed(2),
          cumulativePercentage: cumulativePercentage.toFixed(2),
          classification
        };
      });

      // تجميع حسب الفئة
      const classA = classifiedItems.filter(i => i.classification === 'A');
      const classB = classifiedItems.filter(i => i.classification === 'B');
      const classC = classifiedItems.filter(i => i.classification === 'C');

      res.json({
        success: true,
        data: {
          summary: {
            totalItems: items.length,
            totalValue,
            classACount: classA.length,
            classBCount: classB.length,
            classCCount: classC.length,
            classAValue: classA.reduce((sum, i) => sum + i.totalValue, 0),
            classBValue: classB.reduce((sum, i) => sum + i.totalValue, 0),
            classCValue: classC.reduce((sum, i) => sum + i.totalValue, 0)
          },
          classA,
          classB,
          classC,
          allItems: classifiedItems
        }
      });
    } catch (error) {
      console.error('Error in ABC analysis:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحليل ABC',
        details: error.message
      });
    }
  }

  // 4. الأصناف بطيئة الحركة
  async getSlowMovingItems(req, res) {
    try {
      const { days = 90 } = req.query;

      const [slowItems] = await db.execute(`
        SELECT 
          ii.id,
          ii.name,
          ii.sku,
          ii.type as category,
          SUM(sl.quantity) as currentStock,
          ii.purchasePrice,
          ii.sellingPrice,
          (SUM(sl.quantity) * ii.purchasePrice) as tiedUpCapital,
          COALESCE(movement_data.totalMovement, 0) as movementLast90Days,
          DATEDIFF(NOW(), movement_data.lastMovement) as daysSinceLastMovement
        FROM InventoryItem ii
        JOIN StockLevel sl ON ii.id = sl.inventoryItemId
        LEFT JOIN (
          SELECT 
            inventoryItemId,
            SUM(ABS(quantity)) as totalMovement,
            MAX(createdAt) as lastMovement
          FROM StockMovement
          WHERE createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY inventoryItemId
        ) movement_data ON ii.id = movement_data.inventoryItemId
        WHERE ii.deletedAt IS NULL
        GROUP BY ii.id, ii.name, ii.sku, ii.type, ii.purchasePrice, ii.sellingPrice, 
                 movement_data.totalMovement, movement_data.lastMovement
        HAVING currentStock > 0 AND (movementLast90Days < 5 OR movementLast90Days IS NULL)
        ORDER BY tiedUpCapital DESC
        LIMIT 20
      `, [days]);

      const totalTiedUpCapital = slowItems.reduce((sum, item) => 
        sum + parseFloat(item.tiedUpCapital || 0), 0
      );

      res.json({
        success: true,
        data: {
          items: slowItems.map(item => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            category: item.category,
            currentStock: parseInt(item.currentStock || 0),
            purchasePrice: parseFloat(item.purchasePrice || 0),
            sellingPrice: parseFloat(item.sellingPrice || 0),
            tiedUpCapital: parseFloat(item.tiedUpCapital || 0),
            movementLast90Days: parseInt(item.movementLast90Days || 0),
            daysSinceLastMovement: parseInt(item.daysSinceLastMovement || 999),
            recommendation: item.daysSinceLastMovement > 180 ? 'تصفية' :
                           item.daysSinceLastMovement > 90 ? 'خصم' : 'مراقبة'
          })),
          summary: {
            totalItems: slowItems.length,
            totalTiedUpCapital,
            avgDaysSinceMovement: slowItems.length > 0 
              ? Math.round(slowItems.reduce((sum, i) => sum + parseInt(i.daysSinceLastMovement || 0), 0) / slowItems.length)
              : 0
          }
        }
      });
    } catch (error) {
      console.error('Error getting slow moving items:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب الأصناف بطيئة الحركة',
        details: error.message
      });
    }
  }

  // 5. تحليل هامش الربح
  async getProfitMarginAnalysis(req, res) {
    try {
      // هامش الربح حسب الصنف
      const [itemMargins] = await db.execute(`
        SELECT 
          ii.id,
          ii.name,
          ii.type as category,
          ii.purchasePrice,
          ii.sellingPrice,
          (ii.sellingPrice - ii.purchasePrice) as profitPerUnit,
          ((ii.sellingPrice - ii.purchasePrice) / NULLIF(ii.purchasePrice, 0) * 100) as marginPercent,
          SUM(sl.quantity) as currentStock,
          (SUM(sl.quantity) * (ii.sellingPrice - ii.purchasePrice)) as potentialProfit
        FROM InventoryItem ii
        JOIN StockLevel sl ON ii.id = sl.inventoryItemId
        WHERE ii.deletedAt IS NULL
        GROUP BY ii.id, ii.name, ii.type, ii.purchasePrice, ii.sellingPrice
        ORDER BY marginPercent DESC
      `);

      // هامش الربح حسب الفئة
      const [categoryMargins] = await db.execute(`
        SELECT 
          ii.type as category,
          AVG((ii.sellingPrice - ii.purchasePrice) / NULLIF(ii.purchasePrice, 0) * 100) as avgMarginPercent,
          SUM(sl.quantity * (ii.sellingPrice - ii.purchasePrice)) as totalPotentialProfit,
          SUM(sl.quantity) as totalQuantity,
          COUNT(DISTINCT ii.id) as itemCount
        FROM InventoryItem ii
        JOIN StockLevel sl ON ii.id = sl.inventoryItemId
        WHERE ii.deletedAt IS NULL
        GROUP BY ii.type
        ORDER BY avgMarginPercent DESC
      `);

      // الأصناف الأكثر ربحية
      const topProfitable = itemMargins
        .sort((a, b) => parseFloat(b.potentialProfit) - parseFloat(a.potentialProfit))
        .slice(0, 10);

      // الأصناف الأقل ربحية
      const leastProfitable = itemMargins
        .filter(i => parseFloat(i.marginPercent) < 20)
        .slice(0, 10);

      res.json({
        success: true,
        data: {
          overall: {
            avgMargin: itemMargins.length > 0 
              ? (itemMargins.reduce((sum, i) => sum + parseFloat(i.marginPercent || 0), 0) / itemMargins.length).toFixed(2)
              : 0,
            totalPotentialProfit: itemMargins.reduce((sum, i) => sum + parseFloat(i.potentialProfit || 0), 0)
          },
          byCategory: categoryMargins.map(cat => ({
            category: cat.category,
            avgMarginPercent: parseFloat(cat.avgMarginPercent || 0).toFixed(2),
            totalPotentialProfit: parseFloat(cat.totalPotentialProfit || 0),
            totalQuantity: parseInt(cat.totalQuantity || 0),
            itemCount: parseInt(cat.itemCount || 0)
          })),
          topProfitable: topProfitable.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            purchasePrice: parseFloat(item.purchasePrice || 0),
            sellingPrice: parseFloat(item.sellingPrice || 0),
            profitPerUnit: parseFloat(item.profitPerUnit || 0),
            marginPercent: parseFloat(item.marginPercent || 0).toFixed(2),
            currentStock: parseInt(item.currentStock || 0),
            potentialProfit: parseFloat(item.potentialProfit || 0)
          })),
          leastProfitable: leastProfitable.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            marginPercent: parseFloat(item.marginPercent || 0).toFixed(2),
            recommendation: parseFloat(item.marginPercent) < 10 ? 'مراجعة السعر' : 'مراقبة'
          }))
        }
      });
    } catch (error) {
      console.error('Error getting profit margin analysis:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في تحليل هامش الربح',
        details: error.message
      });
    }
  }

  // 6. التنبؤ بالطلب (بسيط)
  async getForecasting(req, res) {
    try {
      const { itemId, days = 30 } = req.query;

      let query = `
        SELECT 
          ii.id,
          ii.name,
          ii.type as category,
          SUM(sl.quantity) as currentStock,
          sl.minLevel,
          COALESCE(usage.avgDailyUsage, 0) as avgDailyUsage,
          COALESCE(usage.totalUsage, 0) as totalUsageLast30Days,
          FLOOR(SUM(sl.quantity) / NULLIF(usage.avgDailyUsage, 0)) as daysUntilStockout,
          CASE
            WHEN SUM(sl.quantity) <= sl.minLevel THEN 'عاجل'
            WHEN FLOOR(SUM(sl.quantity) / NULLIF(usage.avgDailyUsage, 0)) <= 7 THEN 'قريب'
            WHEN FLOOR(SUM(sl.quantity) / NULLIF(usage.avgDailyUsage, 0)) <= 14 THEN 'متوسط'
            ELSE 'جيد'
          END as urgency
        FROM InventoryItem ii
        JOIN StockLevel sl ON ii.id = sl.inventoryItemId
        LEFT JOIN (
          SELECT 
            inventoryItemId,
            SUM(ABS(quantity)) / ? as avgDailyUsage,
            SUM(ABS(quantity)) as totalUsage
          FROM StockMovement
          WHERE movementType = 'out' 
            AND createdAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY inventoryItemId
        ) usage ON ii.id = usage.inventoryItemId
        WHERE ii.deletedAt IS NULL
      `;

      const params = [days, days];

      if (itemId) {
        query += ` AND ii.id = ?`;
        params.push(itemId);
      }

      query += `
        GROUP BY ii.id, ii.name, ii.type, sl.minLevel, usage.avgDailyUsage, usage.totalUsage
        HAVING avgDailyUsage > 0
        ORDER BY daysUntilStockout ASC
        LIMIT 20
      `;

      const [forecast] = await db.execute(query, params);

      res.json({
        success: true,
        data: {
          forecastPeriod: days,
          items: forecast.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            currentStock: parseInt(item.currentStock || 0),
            minLevel: parseInt(item.minLevel || 0),
            avgDailyUsage: parseFloat(item.avgDailyUsage || 0).toFixed(2),
            totalUsageLast30Days: parseInt(item.totalUsageLast30Days || 0),
            daysUntilStockout: parseInt(item.daysUntilStockout || 999),
            urgency: item.urgency,
            recommendedReorder: parseInt(item.minLevel) * 2,
            predictedDemandNext30Days: Math.ceil(parseFloat(item.avgDailyUsage || 0) * 30)
          }))
        }
      });
    } catch (error) {
      console.error('Error in forecasting:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في التنبؤ بالطلب',
        details: error.message
      });
    }
  }

  // 7. ملخص التحليلات
  async getAnalyticsSummary(req, res) {
    try {
      // جمع كل التحليلات في استدعاء واحد
      const [summary] = await db.execute(`
        SELECT 
          COUNT(DISTINCT ii.id) as totalItems,
          SUM(sl.quantity) as totalQuantity,
          SUM(sl.quantity * ii.purchasePrice) as totalPurchaseValue,
          SUM(sl.quantity * ii.sellingPrice) as totalSellingValue,
          (SUM(sl.quantity * ii.sellingPrice) - SUM(sl.quantity * ii.purchasePrice)) as potentialProfit,
          COUNT(DISTINCT w.id) as totalWarehouses,
          COUNT(DISTINCT ii.type) as totalCategories
        FROM InventoryItem ii
        JOIN StockLevel sl ON ii.id = sl.inventoryItemId
        JOIN Warehouse w ON sl.warehouseId = w.id
        WHERE ii.deletedAt IS NULL AND w.deletedAt IS NULL
      `);

      const data = summary[0];
      const profitMargin = data.totalPurchaseValue > 0
        ? ((parseFloat(data.potentialProfit) / parseFloat(data.totalPurchaseValue)) * 100).toFixed(2)
        : 0;

      res.json({
        success: true,
        data: {
          totalItems: parseInt(data.totalItems || 0),
          totalQuantity: parseInt(data.totalQuantity || 0),
          totalPurchaseValue: parseFloat(data.totalPurchaseValue || 0),
          totalSellingValue: parseFloat(data.totalSellingValue || 0),
          potentialProfit: parseFloat(data.potentialProfit || 0),
          profitMargin: parseFloat(profitMargin),
          totalWarehouses: parseInt(data.totalWarehouses || 0),
          totalCategories: parseInt(data.totalCategories || 0)
        }
      });
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      res.status(500).json({
        success: false,
        message: 'حدث خطأ في جلب ملخص التحليلات',
        details: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();

