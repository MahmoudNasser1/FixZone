const db = require('../db');
const XLSX = require('xlsx');
// PDF generation will use HTML template approach for now
// Can be enhanced with pdfkit or puppeteer later

class TechnicianReportsController {
  /**
   * تصدير تقرير الأداء
   * @param {string} format - 'pdf' أو 'excel'
   * @param {object} filters - { technicianId, startDate, endDate }
   */
  async exportPerformanceReport(req, res) {
    try {
      const { format = 'pdf' } = req.query;
      const { id: technicianId } = req.params;
      const { startDate, endDate } = req.query;

      // جلب بيانات الأداء
      const performanceData = await this.getPerformanceData(technicianId, { startDate, endDate });

      if (format === 'excel') {
        const buffer = await this.exportToExcel(performanceData, 'تقرير الأداء');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="performance_report_${technicianId || 'all'}_${Date.now()}.xlsx"`);
        return res.send(buffer);
      } else {
        const html = await this.exportToPDF(performanceData, 'تقرير الأداء');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    } catch (error) {
      console.error('Error exporting performance report:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        details: error.message
      });
    }
  }

  /**
   * تصدير تقرير الأجور
   * @param {string} format - 'pdf' أو 'excel'
   * @param {object} filters - { technicianId, startDate, endDate }
   */
  async exportWagesReport(req, res) {
    try {
      const { format = 'pdf' } = req.query;
      const { id: technicianId } = req.params;
      const { startDate, endDate } = req.query;

      // جلب بيانات الأجور
      const wagesData = await this.getWagesData(technicianId, { startDate, endDate });

      if (format === 'excel') {
        const buffer = await this.exportToExcel(wagesData, 'تقرير الأجور');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="wages_report_${technicianId || 'all'}_${Date.now()}.xlsx"`);
        return res.send(buffer);
      } else {
        const html = await this.exportToPDF(wagesData, 'تقرير الأجور');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    } catch (error) {
      console.error('Error exporting wages report:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        details: error.message
      });
    }
  }

  /**
   * تصدير تقرير المهارات
   * @param {string} format - 'pdf' أو 'excel'
   * @param {object} filters - { technicianId }
   */
  async exportSkillsReport(req, res) {
    try {
      const { format = 'pdf' } = req.query;
      const { id: technicianId } = req.params;

      // جلب بيانات المهارات
      const skillsData = await this.getSkillsData(technicianId);

      if (format === 'excel') {
        const buffer = await this.exportToExcel(skillsData, 'تقرير المهارات');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="skills_report_${technicianId || 'all'}_${Date.now()}.xlsx"`);
        return res.send(buffer);
      } else {
        const html = await this.exportToPDF(skillsData, 'تقرير المهارات');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    } catch (error) {
      console.error('Error exporting skills report:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        details: error.message
      });
    }
  }

  /**
   * تصدير تقرير الجدولة
   * @param {string} format - 'pdf' أو 'excel'
   * @param {object} filters - { technicianId, startDate, endDate }
   */
  async exportScheduleReport(req, res) {
    try {
      const { format = 'pdf' } = req.query;
      const { id: technicianId } = req.params;
      const { startDate, endDate } = req.query;

      // جلب بيانات الجدولة
      const scheduleData = await this.getScheduleData(technicianId, { startDate, endDate });

      if (format === 'excel') {
        const buffer = await this.exportToExcel(scheduleData, 'تقرير الجدولة');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="schedule_report_${technicianId || 'all'}_${Date.now()}.xlsx"`);
        return res.send(buffer);
      } else {
        const html = await this.exportToPDF(scheduleData, 'تقرير الجدولة');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    } catch (error) {
      console.error('Error exporting schedule report:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        details: error.message
      });
    }
  }

  /**
   * تصدير تقرير شامل لجميع الفنيين
   * @param {string} format - 'pdf' أو 'excel'
   * @param {object} filters - { startDate, endDate }
   */
  async exportAllTechniciansReport(req, res) {
    try {
      const { format = 'pdf' } = req.query;
      const { startDate, endDate } = req.query;

      // جلب بيانات جميع الفنيين
      const allTechniciansData = await this.getAllTechniciansData({ startDate, endDate });

      if (format === 'excel') {
        const buffer = await this.exportToExcel(allTechniciansData, 'تقرير شامل - جميع الفنيين');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="all_technicians_report_${Date.now()}.xlsx"`);
        return res.send(buffer);
      } else {
        const html = await this.exportToPDF(allTechniciansData, 'تقرير شامل - جميع الفنيين');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(html);
      }
    } catch (error) {
      console.error('Error exporting all technicians report:', error);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        details: error.message
      });
    }
  }

  // Helper Methods

  /**
   * جلب بيانات الأداء
   */
  async getPerformanceData(technicianId, filters = {}) {
    const { startDate, endDate } = filters;
    let query = `
      SELECT 
        u.id as technicianId,
        u.name as technicianName,
        COUNT(DISTINCT tr.repairId) as totalRepairs,
        COUNT(DISTINCT CASE WHEN tr.status = 'completed' THEN tr.repairId END) as completedRepairs,
        AVG(CASE WHEN tr.status = 'completed' THEN tr.timeSpent END) as averageTimeSpent,
        SUM(CASE WHEN tr.status = 'completed' THEN tr.timeSpent END) as totalTimeSpent
      FROM User u
      LEFT JOIN TechnicianRepairs tr ON u.id = tr.technicianId
      WHERE u.id = ? AND u.deletedAt IS NULL
    `;
    const params = [technicianId];

    if (startDate) {
      query += ' AND DATE(tr.assignedAt) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND DATE(tr.assignedAt) <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY u.id, u.name';

    const [rows] = await db.execute(query, params);
    return rows[0] || {};
  }

  /**
   * جلب بيانات الأجور
   */
  async getWagesData(technicianId, filters = {}) {
    const { startDate, endDate } = filters;
    let query = `
      SELECT 
        tw.*,
        u.name as technicianName
      FROM TechnicianWages tw
      JOIN User u ON tw.technicianId = u.id
      WHERE tw.technicianId = ?
    `;
    const params = [technicianId];

    if (startDate) {
      query += ' AND tw.periodStart >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND tw.periodEnd <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY tw.periodStart DESC';

    const [rows] = await db.execute(query, params);
    return rows;
  }

  /**
   * جلب بيانات المهارات
   */
  async getSkillsData(technicianId) {
    const query = `
      SELECT 
        ts.*,
        u.name as technicianName
      FROM TechnicianSkills ts
      JOIN User u ON ts.technicianId = u.id
      WHERE ts.technicianId = ?
      ORDER BY ts.skillName
    `;
    const [rows] = await db.execute(query, [technicianId]);
    return rows;
  }

  /**
   * جلب بيانات الجدولة
   */
  async getScheduleData(technicianId, filters = {}) {
    const { startDate, endDate } = filters;
    let query = `
      SELECT 
        ts.*,
        u.name as technicianName,
        CONCAT("REP-", YEAR(rr.createdAt), LPAD(MONTH(rr.createdAt), 2, "0"), LPAD(DAY(rr.createdAt), 2, "0"), "-", LPAD(rr.id, 3, "0")) as requestNumber,
        c.name as customerName
      FROM TechnicianSchedules ts
      JOIN User u ON ts.technicianId = u.id
      JOIN RepairRequest rr ON ts.repairId = rr.id
      LEFT JOIN Customer c ON rr.customerId = c.id
      WHERE ts.technicianId = ? AND rr.deletedAt IS NULL
    `;
    const params = [technicianId];

    if (startDate) {
      query += ' AND ts.scheduledDate >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND ts.scheduledDate <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY ts.scheduledDate, ts.scheduledTime';

    const [rows] = await db.execute(query, params);
    return rows;
  }

  /**
   * جلب بيانات جميع الفنيين
   */
  async getAllTechniciansData(filters = {}) {
    const { startDate, endDate } = filters;
    let query = `
      SELECT 
        u.id as technicianId,
        u.name as technicianName,
        COUNT(DISTINCT tr.repairId) as totalRepairs,
        COUNT(DISTINCT CASE WHEN tr.status = 'completed' THEN tr.repairId END) as completedRepairs,
        COUNT(DISTINCT ts.id) as skillsCount,
        COUNT(DISTINCT tw.id) as wagesRecordsCount,
        SUM(CASE WHEN tw.paymentStatus = 'paid' THEN tw.totalEarnings ELSE 0 END) as totalEarnings
      FROM User u
      INNER JOIN Role r ON u.roleId = r.id
      LEFT JOIN TechnicianRepairs tr ON u.id = tr.technicianId
      LEFT JOIN TechnicianSkills ts ON u.id = ts.technicianId
      LEFT JOIN TechnicianWages tw ON u.id = tw.technicianId
      WHERE LOWER(TRIM(r.name)) = 'technician' AND u.deletedAt IS NULL
    `;
    const params = [];

    if (startDate) {
      query += ' AND (tr.assignedAt >= ? OR tr.assignedAt IS NULL)';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND (tr.assignedAt <= ? OR tr.assignedAt IS NULL)';
      params.push(endDate);
    }

    query += ' GROUP BY u.id, u.name ORDER BY u.name';

    const [rows] = await db.execute(query, params);
    return rows;
  }

  /**
   * تصدير إلى Excel
   */
  async exportToExcel(data, title) {
    try {
      const workbook = XLSX.utils.book_new();
      
      // تحويل البيانات إلى ورقة عمل
      let worksheet;
      if (Array.isArray(data)) {
        if (data.length === 0) {
          worksheet = XLSX.utils.aoa_to_sheet([['لا توجد بيانات']]);
        } else {
          // تحويل المفاتيح إلى رؤوس الأعمدة
          const headers = Object.keys(data[0]);
          const rows = data.map(row => headers.map(key => row[key] || ''));
          worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        }
      } else {
        // بيانات مفردة
        const headers = Object.keys(data);
        const values = Object.values(data);
        worksheet = XLSX.utils.aoa_to_sheet([headers, values]);
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, title);

      // توليد buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      return buffer;
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw error;
    }
  }

  /**
   * تصدير إلى PDF (HTML template approach)
   * Note: This returns HTML that can be converted to PDF using puppeteer or browser print
   * For now, we'll return HTML and the frontend can handle PDF generation
   */
  async exportToPDF(data, title) {
    try {
      const currentDate = new Date().toLocaleDateString('ar-EG');
      
      let tableHTML = '';
      if (Array.isArray(data)) {
        if (data.length === 0) {
          tableHTML = '<p style="text-align: center; padding: 20px;">لا توجد بيانات</p>';
        } else {
          const headers = Object.keys(data[0]);
          tableHTML = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">';
          tableHTML += '<thead><tr style="background-color: #3b82f6; color: white;">';
          headers.forEach(header => {
            tableHTML += `<th style="padding: 10px; border: 1px solid #ddd; text-align: right;">${header}</th>`;
          });
          tableHTML += '</tr></thead><tbody>';
          data.forEach(row => {
            tableHTML += '<tr>';
            headers.forEach(header => {
              tableHTML += `<td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${row[header] || ''}</td>`;
            });
            tableHTML += '</tr>';
          });
          tableHTML += '</tbody></table>';
        }
      } else {
        tableHTML = '<div style="padding: 20px;">';
        Object.keys(data).forEach(key => {
          tableHTML += `<p><strong>${key}:</strong> ${data[key]}</p>`;
        });
        tableHTML += '</div>';
      }

      const html = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #1f2937; }
            .header { text-align: center; margin-bottom: 30px; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${title}</h1>
            <p>تاريخ التقرير: ${currentDate}</p>
          </div>
          ${tableHTML}
          <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة FixZone System - ${currentDate}</p>
          </div>
        </body>
        </html>
      `;

      return html;
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw error;
    }
  }
}

module.exports = new TechnicianReportsController();

