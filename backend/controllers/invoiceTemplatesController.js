const db = require('../db');

/**
 * Invoice Templates Controller
 * إدارة قوالب الفواتير المختلفة (عادية، ضريبية، تجارية، خدمية)
 */
class InvoiceTemplatesController {
  
  // جلب جميع قوالب الفواتير
  async getAllTemplates(req, res) {
    try {
      const [templates] = await db.query(`
        SELECT 
          id, name, type, description, isDefault, isActive,
          headerHTML, footerHTML, stylesCSS, settings,
          createdAt, updatedAt
        FROM InvoiceTemplate 
        WHERE deletedAt IS NULL
        ORDER BY isDefault DESC, name ASC
      `);

      res.json({
        success: true,
        data: templates.map(template => ({
          ...template,
          settings: template.settings ? JSON.parse(template.settings) : {}
        }))
      });
    } catch (error) {
      console.error('Error fetching invoice templates:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // جلب قالب واحد
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;

      const [templates] = await db.query(`
        SELECT * FROM InvoiceTemplate 
        WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (templates.length === 0) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      const template = {
        ...templates[0],
        settings: templates[0].settings ? JSON.parse(templates[0].settings) : {}
      };

      res.json({ success: true, data: template });
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // إنشاء قالب جديد
  async createTemplate(req, res) {
    try {
      const {
        name,
        type = 'standard',
        description = '',
        headerHTML = '',
        footerHTML = '',
        stylesCSS = '',
        settings = {},
        isDefault = false,
        isActive = true
      } = req.body;

      if (!name) {
        return res.status(400).json({ success: false, error: 'Template name is required' });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // إذا كان القالب افتراضي، قم بإلغاء الافتراضية من القوالب الأخرى من نفس النوع
        if (isDefault) {
          await connection.query(`
            UPDATE InvoiceTemplate 
            SET isDefault = FALSE 
            WHERE type = ? AND deletedAt IS NULL
          `, [type]);
        }

        const [result] = await connection.query(`
          INSERT INTO InvoiceTemplate (
            name, type, description, headerHTML, footerHTML, 
            stylesCSS, settings, isDefault, isActive, 
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          name, type, description, headerHTML, footerHTML,
          stylesCSS, JSON.stringify(settings), isDefault, isActive
        ]);

        await connection.commit();

        // جلب القالب المنشأ
        const [created] = await connection.query(`
          SELECT * FROM InvoiceTemplate WHERE id = ?
        `, [result.insertId]);

        res.status(201).json({
          success: true,
          data: {
            ...created[0],
            settings: created[0].settings ? JSON.parse(created[0].settings) : {}
          },
          message: 'Template created successfully'
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // تحديث قالب
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        type,
        description,
        headerHTML,
        footerHTML,
        stylesCSS,
        settings,
        isDefault,
        isActive
      } = req.body;

      // التحقق من وجود القالب
      const [existing] = await db.query(`
        SELECT id, type FROM InvoiceTemplate WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // إذا كان القالب سيصبح افتراضي، قم بإلغاء الافتراضية من القوالب الأخرى
        if (isDefault) {
          const templateType = type || existing[0].type;
          await connection.query(`
            UPDATE InvoiceTemplate 
            SET isDefault = FALSE 
            WHERE type = ? AND id != ? AND deletedAt IS NULL
          `, [templateType, id]);
        }

        // بناء استعلام التحديث ديناميكيًا
        const updates = [];
        const values = [];

        if (name !== undefined) {
          updates.push('name = ?');
          values.push(name);
        }
        if (type !== undefined) {
          updates.push('type = ?');
          values.push(type);
        }
        if (description !== undefined) {
          updates.push('description = ?');
          values.push(description);
        }
        if (headerHTML !== undefined) {
          updates.push('headerHTML = ?');
          values.push(headerHTML);
        }
        if (footerHTML !== undefined) {
          updates.push('footerHTML = ?');
          values.push(footerHTML);
        }
        if (stylesCSS !== undefined) {
          updates.push('stylesCSS = ?');
          values.push(stylesCSS);
        }
        if (settings !== undefined) {
          updates.push('settings = ?');
          values.push(JSON.stringify(settings));
        }
        if (isDefault !== undefined) {
          updates.push('isDefault = ?');
          values.push(isDefault);
        }
        if (isActive !== undefined) {
          updates.push('isActive = ?');
          values.push(isActive);
        }

        if (updates.length === 0) {
          return res.status(400).json({ success: false, error: 'No fields to update' });
        }

        updates.push('updatedAt = NOW()');
        values.push(id);

        await connection.query(`
          UPDATE InvoiceTemplate SET ${updates.join(', ')} WHERE id = ?
        `, values);

        await connection.commit();

        // جلب القالب المحدث
        const [updated] = await connection.query(`
          SELECT * FROM InvoiceTemplate WHERE id = ?
        `, [id]);

        res.json({
          success: true,
          data: {
            ...updated[0],
            settings: updated[0].settings ? JSON.parse(updated[0].settings) : {}
          },
          message: 'Template updated successfully'
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // حذف قالب (soft delete)
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;

      // التحقق من وجود القالب
      const [existing] = await db.query(`
        SELECT id, isDefault FROM InvoiceTemplate WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      // منع حذف القالب الافتراضي
      if (existing[0].isDefault) {
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete default template. Set another template as default first.' 
        });
      }

      await db.query(`
        UPDATE InvoiceTemplate SET deletedAt = NOW(), updatedAt = NOW() WHERE id = ?
      `, [id]);

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // تعيين قالب كافتراضي
  async setAsDefault(req, res) {
    try {
      const { id } = req.params;

      // التحقق من وجود القالب
      const [existing] = await db.query(`
        SELECT id, type FROM InvoiceTemplate WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (existing.length === 0) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // إلغاء الافتراضية من القوالب الأخرى من نفس النوع
        await connection.query(`
          UPDATE InvoiceTemplate 
          SET isDefault = FALSE 
          WHERE type = ? AND deletedAt IS NULL
        `, [existing[0].type]);

        // تعيين القالب الحالي كافتراضي
        await connection.query(`
          UPDATE InvoiceTemplate 
          SET isDefault = TRUE, updatedAt = NOW() 
          WHERE id = ?
        `, [id]);

        await connection.commit();

        res.json({
          success: true,
          message: 'Template set as default successfully'
        });
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error setting template as default:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // معاينة قالب مع فاتورة تجريبية
  async previewTemplate(req, res) {
    try {
      const { id } = req.params;
      const { invoiceId } = req.query;

      // جلب القالب
      const [templates] = await db.query(`
        SELECT * FROM InvoiceTemplate WHERE id = ? AND deletedAt IS NULL
      `, [id]);

      if (templates.length === 0) {
        return res.status(404).json({ success: false, error: 'Template not found' });
      }

      const template = {
        ...templates[0],
        settings: templates[0].settings ? JSON.parse(templates[0].settings) : {}
      };

      let invoice = null;
      if (invoiceId) {
        // جلب فاتورة حقيقية للمعاينة
        const [invoices] = await db.query(`
          SELECT i.*, c.name as customerName, c.phone as customerPhone, c.email as customerEmail
          FROM Invoice i
          LEFT JOIN RepairRequest rr ON i.repairRequestId = rr.id
          LEFT JOIN Customer c ON rr.customerId = c.id
          WHERE i.id = ? AND i.deletedAt IS NULL
        `, [invoiceId]);

        if (invoices.length > 0) {
          invoice = invoices[0];
          // جلب عناصر الفاتورة
          const [items] = await db.query(`
            SELECT ii.*, 
              COALESCE(inv.name, s.name) as itemName,
              COALESCE(inv.sku, s.id) as itemCode
            FROM InvoiceItem ii
            LEFT JOIN InventoryItem inv ON ii.inventoryItemId = inv.id
            LEFT JOIN Service s ON ii.serviceId = s.id
            WHERE ii.invoiceId = ?
          `, [invoiceId]);
          invoice.items = items;
        }
      }

      // إنشاء فاتورة تجريبية إذا لم توجد فاتورة حقيقية
      if (!invoice) {
        invoice = {
          id: 'SAMPLE-001',
          totalAmount: 1500.00,
          amountPaid: 500.00,
          status: 'sent',
          createdAt: new Date(),
          customerName: 'أحمد محمد علي',
          customerPhone: '+966501234567',
          customerEmail: 'ahmed@example.com',
          items: [
            { itemName: 'قطعة غيار - شاشة', quantity: 1, unitPrice: 800.00, totalPrice: 800.00 },
            { itemName: 'خدمة إصلاح', quantity: 1, unitPrice: 700.00, totalPrice: 700.00 }
          ]
        };
      }

      res.json({
        success: true,
        data: {
          template,
          invoice,
          previewHTML: this.generateInvoiceHTML(template, invoice)
        }
      });
    } catch (error) {
      console.error('Error previewing template:', error);
      res.status(500).json({ success: false, error: 'Server error', details: error.message });
    }
  }

  // توليد HTML للفاتورة باستخدام القالب
  generateInvoiceHTML(template, invoice) {
    const settings = template.settings || {};
    
    let html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>فاتورة #${invoice.id}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; }
          .invoice-container { max-width: 800px; margin: 0 auto; background: white; }
          .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .company-info { text-align: center; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .customer-info, .invoice-info { width: 48%; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: right; }
          .items-table th { background-color: #f5f5f5; }
          .totals { text-align: left; margin-bottom: 30px; }
          .footer { border-top: 1px solid #ddd; padding-top: 20px; text-align: center; }
          ${template.stylesCSS || ''}
        </style>
      </head>
      <body>
        <div class="invoice-container">
          <div class="header">
            ${template.headerHTML || `
              <div class="company-info">
                <h1>${settings.companyName || 'شركة فيكس زون'}</h1>
                <p>${settings.companyAddress || 'العنوان غير محدد'}</p>
                <p>هاتف: ${settings.companyPhone || 'غير محدد'} | إيميل: ${settings.companyEmail || 'غير محدد'}</p>
              </div>
            `}
          </div>

          <div class="invoice-details">
            <div class="customer-info">
              <h3>بيانات العميل</h3>
              <p><strong>الاسم:</strong> ${invoice.customerName || 'غير محدد'}</p>
              <p><strong>الهاتف:</strong> ${invoice.customerPhone || 'غير محدد'}</p>
              <p><strong>الإيميل:</strong> ${invoice.customerEmail || 'غير محدد'}</p>
            </div>
            <div class="invoice-info">
              <h3>بيانات الفاتورة</h3>
              <p><strong>رقم الفاتورة:</strong> #${invoice.id}</p>
              <p><strong>التاريخ:</strong> ${new Date(invoice.createdAt).toLocaleDateString('ar-SA')}</p>
              <p><strong>الحالة:</strong> ${this.getStatusText(invoice.status)}</p>
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>البند</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.items || []).map(item => `
                <tr>
                  <td>${item.itemName || 'بند غير محدد'}</td>
                  <td>${item.quantity || 1}</td>
                  <td>${Number(item.unitPrice || 0).toFixed(2)}</td>
                  <td>${Number(item.totalPrice || 0).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <p><strong>الإجمالي: ${Number(invoice.totalAmount || 0).toFixed(2)} ${settings.currency || 'ر.س'}</strong></p>
            <p>المدفوع: ${Number(invoice.amountPaid || 0).toFixed(2)} ${settings.currency || 'ر.س'}</p>
            <p>المتبقي: ${Number((invoice.totalAmount || 0) - (invoice.amountPaid || 0)).toFixed(2)} ${settings.currency || 'ر.س'}</p>
          </div>

          <div class="footer">
            ${template.footerHTML || `
              <p>شكرًا لتعاملكم معنا</p>
              <p>${settings.footerText || 'جميع الحقوق محفوظة'}</p>
            `}
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  getStatusText(status) {
    const statusMap = {
      draft: 'مسودة',
      sent: 'مرسلة',
      paid: 'مدفوعة',
      overdue: 'متأخرة'
    };
    return statusMap[status] || status;
  }
}

module.exports = new InvoiceTemplatesController();
