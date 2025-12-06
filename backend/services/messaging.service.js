// backend/services/messaging.service.js
// Messaging Service - الخدمة الرئيسية الموحدة للمراسلة

const db = require('../db');
const templateService = require('./template.service');
const whatsappService = require('./whatsapp.service');
const emailService = require('./email.service');

class MessagingService {
  /**
   * إرسال رسالة موحدة (يدعم WhatsApp و Email)
   * @param {object} data - بيانات الإرسال
   * @param {string} data.entityType - نوع الكيان (invoice, repair, quotation, payment)
   * @param {number} data.entityId - معرف الكيان
   * @param {number} data.customerId - معرف العميل
   * @param {string|array} data.channels - قناة أو قنوات الإرسال ('whatsapp', 'email', أو ['whatsapp', 'email'])
   * @param {string} data.recipient - رقم الهاتف أو البريد الإلكتروني
   * @param {string} data.message - نص الرسالة (اختياري - سيتم توليده من القالب)
   * @param {string} data.template - اسم القالب (اختياري)
   * @param {object} data.variables - متغيرات القالب (اختياري)
   * @param {object} data.options - خيارات إضافية
   * @param {number} data.sentBy - معرف المستخدم الذي أرسل الرسالة
   * @returns {Promise<object>} - نتيجة الإرسال
   */
  async sendMessage(data) {
    const { entityType, entityId, customerId, channels, recipient, message, template, variables, options = {}, sentBy } = data;

    // التحقق من البيانات المطلوبة
    if (!entityType || !entityId || !channels || !recipient) {
      throw new Error('بيانات الإرسال غير مكتملة');
    }

    // تحويل channels إلى array إذا كان string
    const channelsArray = Array.isArray(channels) ? channels : [channels];

    // تحديد المستلم لكل قناة
    const recipients = {
      whatsapp: options.whatsappRecipient || recipient,
      email: options.emailRecipient || recipient
    };

    // التحقق من وجود مستلم لكل قناة
    for (const channel of channelsArray) {
      if (!recipients[channel]) {
        throw new Error(`لا يوجد مستلم للقناة: ${channel}`);
      }
    }

    // تحضير المتغيرات تلقائياً إذا لم يتم إرسالها أو كانت غير مكتملة
    let preparedVariables = variables || {};
    
    // 🔍 DEBUG: تسجيل variables المستلمة
    console.log('[MESSAGING] ==========================================');
    console.log('[MESSAGING] sendMessage called with:', {
      entityType,
      entityId,
      hasVariables: !!variables,
      variablesKeys: variables ? Object.keys(variables) : [],
      problemValue: variables?.problem,
      problemType: typeof variables?.problem,
      template
    });
    
    // إذا لم يتم إرسال variables أو كانت فارغة أو problem غير موجود، نحضرها تلقائياً
    const needsAutoPreparation = !variables || 
                                 Object.keys(variables).length === 0 || 
                                 (entityType === 'repair' && (!variables.problem || variables.problem === 'غير محدد' || variables.problem === null || variables.problem === undefined));
    
    console.log('[MESSAGING] needsAutoPreparation:', needsAutoPreparation, {
      hasVariables: !!variables,
      variablesLength: variables ? Object.keys(variables).length : 0,
      problemValue: variables?.problem,
      problemType: typeof variables?.problem,
      problemIsUndefined: variables?.problem === 'غير محدد' || variables?.problem === null || variables?.problem === undefined
    });
    
    if (needsAutoPreparation && template && entityId) {
      console.log('[MESSAGING] ✅ Will prepare variables automatically from database');
      try {
        // جلب بيانات الكيان والعميل لتحضير المتغيرات
        if (entityType === 'repair') {
          // جلب البيانات - الحقل الوحيد في قاعدة البيانات هو reportedProblem
          // قد تكون البيانات محفوظة في customFields أيضاً
          const [repairs] = await db.execute(
            `SELECT r.id,
             r.reportedProblem,
             r.technicianReport,
             r.status,
             r.trackingToken,
             r.estimatedCost,
             r.notes,
             r.customerNotes,
             r.customFields,
             r.createdAt,
             r.updatedAt,
             r.oldInvoiceNumber,
             r.rejectionReason,
             r.holdReason,
             COALESCE(vo.label, d.brand) as deviceBrand,
             d.model as deviceModel,
             d.deviceType,
             c.name as customerName,
             c.firstName,
             c.phone,
             c.email
             FROM RepairRequest r
             LEFT JOIN Customer c ON r.customerId = c.id
             LEFT JOIN Device d ON r.deviceId = d.id
             LEFT JOIN VariableOption vo ON d.brandId = vo.id
             WHERE r.id = ? AND r.deletedAt IS NULL`,
            [entityId]
          );
          
          if (repairs.length > 0) {
            const repair = repairs[0];
            
            // 🔍 DEBUG: استعلام مباشر من قاعدة البيانات للتحقق من القيمة الفعلية
            try {
              const [directCheck] = await db.execute(
                'SELECT id, reportedProblem, customFields, customerNotes, notes FROM RepairRequest WHERE id = ?',
                [entityId]
              );
              if (directCheck.length > 0) {
                const directData = directCheck[0];
                console.log('[MESSAGING] 🔍 DIRECT DB QUERY RESULT:', {
                  id: directData.id,
                  reportedProblem: directData.reportedProblem,
                  reportedProblemType: typeof directData.reportedProblem,
                  reportedProblemIsNull: directData.reportedProblem === null,
                  reportedProblemLength: directData.reportedProblem ? directData.reportedProblem.length : 0,
                  reportedProblemValue: directData.reportedProblem ? `${String(directData.reportedProblem).substring(0, 100)}...` : 'NULL/EMPTY',
                  hasCustomFields: !!directData.customFields,
                  customFieldsValue: directData.customFields ? `${String(directData.customFields).substring(0, 100)}...` : 'NULL',
                  customerNotes: directData.customerNotes ? `${String(directData.customerNotes).substring(0, 50)}...` : 'NULL',
                  notes: directData.notes ? `${String(directData.notes).substring(0, 50)}...` : 'NULL'
                });
              }
            } catch (dbError) {
              console.error('[MESSAGING] Error in direct DB query:', dbError);
            }
            
            // محاولة استخراج problemDescription من customFields إذا كان موجوداً
            let problemFromCustomFields = null;
            if (repair.customFields) {
              try {
                const customFields = typeof repair.customFields === 'string' 
                  ? JSON.parse(repair.customFields) 
                  : repair.customFields;
                problemFromCustomFields = customFields?.problemDescription || 
                                         customFields?.problem || 
                                         customFields?.description ||
                                         customFields?.issueDescription ||
                                         null;
                if (problemFromCustomFields) {
                  console.log('[MESSAGING] ✅ Found problem in customFields:', problemFromCustomFields.substring(0, 50));
                }
              } catch (e) {
                console.warn('[MESSAGING] Error parsing customFields:', e);
              }
            }
            
            // استخدام customerNotes أو notes أو customFields كبديل إذا كان reportedProblem فارغاً
            const finalProblem = repair.reportedProblem || 
                                problemFromCustomFields || 
                                repair.customerNotes || 
                                repair.notes || 
                                null;
            
            console.log('[MESSAGING] 🔍 Problem resolution:', {
              reportedProblem: repair.reportedProblem ? `${String(repair.reportedProblem).substring(0, 50)}...` : 'NULL/EMPTY',
              problemFromCustomFields: problemFromCustomFields ? `${String(problemFromCustomFields).substring(0, 50)}...` : 'NULL',
              customerNotes: repair.customerNotes ? `${String(repair.customerNotes).substring(0, 50)}...` : 'NULL',
              notes: repair.notes ? `${String(repair.notes).substring(0, 50)}...` : 'NULL',
              finalProblem: finalProblem ? `${String(finalProblem).substring(0, 100)}...` : 'NULL/EMPTY'
            });
            
            // تحديث repair.reportedProblem بـ finalProblem قبل استدعاء prepareRepairVariables
            // هذا مهم جداً لأن prepareRepairVariables يعتمد على repair.reportedProblem
            if (!repair.reportedProblem && finalProblem) {
              repair.reportedProblem = finalProblem;
              console.log('[MESSAGING] ✅ Updated repair.reportedProblem with finalProblem from alternative source');
            } else if (!repair.reportedProblem) {
              console.warn('[MESSAGING] ⚠️ reportedProblem is NULL/EMPTY and no alternatives found for repair ID:', repair.id);
            } else {
              console.log('[MESSAGING] ✅ reportedProblem found:', repair.reportedProblem.substring(0, 50));
            }
            
            // تسجيل للتحقق من البيانات بعد التحديث
            console.log('[MESSAGING] Repair data after update:', {
              id: repair.id,
              reportedProblem: repair.reportedProblem,
              reportedProblemType: typeof repair.reportedProblem,
              reportedProblemLength: repair.reportedProblem ? repair.reportedProblem.length : 0,
              reportedProblemValue: repair.reportedProblem ? `${repair.reportedProblem.substring(0, 100)}...` : 'NULL/EMPTY',
              problemFromCustomFields: problemFromCustomFields ? `${String(problemFromCustomFields).substring(0, 50)}...` : 'NULL/EMPTY',
              customerNotes: repair.customerNotes ? `${String(repair.customerNotes).substring(0, 50)}...` : 'NULL/EMPTY',
              notes: repair.notes ? `${String(repair.notes).substring(0, 50)}...` : 'NULL/EMPTY',
              finalProblem: finalProblem,
              finalProblemLength: finalProblem ? finalProblem.length : 0,
              finalProblemValue: finalProblem ? `${String(finalProblem).substring(0, 100)}...` : 'NULL/EMPTY',
              hasReportedProblem: !!repair.reportedProblem,
              deviceBrand: repair.deviceBrand,
              deviceModel: repair.deviceModel
            });
            
            const customer = {
              name: repair.customerName,
              firstName: repair.firstName,
              phone: repair.phone,
              email: repair.email
            };
            
            // الآن repair.reportedProblem محدث بشكل صحيح
            preparedVariables = await templateService.prepareRepairVariables(repair, customer);
            
            // تسجيل المتغيرات المحضرة
            console.log('[MESSAGING] Prepared variables:', {
              problem: preparedVariables.problem,
              repairNumber: preparedVariables.repairNumber,
              deviceInfo: preparedVariables.deviceInfo
            });
          }
        } else if (entityType === 'invoice') {
          const [invoices] = await db.execute(
            `SELECT i.*, c.name as customerName, c.firstName, c.phone, c.email
             FROM Invoice i
             LEFT JOIN Customer c ON i.customerId = c.id
             WHERE i.id = ? AND i.deletedAt IS NULL`,
            [entityId]
          );
          
          if (invoices.length > 0) {
            const invoice = invoices[0];
            const customer = {
              name: invoice.customerName,
              firstName: invoice.firstName,
              phone: invoice.phone,
              email: invoice.email
            };
            
            // جلب عناصر الفاتورة
            const [items] = await db.execute(
              'SELECT * FROM InvoiceItem WHERE invoiceId = ?',
              [entityId]
            );
            
            preparedVariables = await templateService.prepareInvoiceVariables(invoice, customer, items);
          }
        } else if (entityType === 'quotation') {
          const [quotations] = await db.execute(
            `SELECT q.*, c.name as customerName, c.firstName, c.phone, c.email, q.repairRequestId
             FROM Quotation q
             LEFT JOIN Customer c ON q.customerId = c.id
             WHERE q.id = ? AND q.deletedAt IS NULL`,
            [entityId]
          );
          
          if (quotations.length > 0) {
            const quotation = quotations[0];
            const customer = {
              name: quotation.customerName,
              firstName: quotation.firstName,
              phone: quotation.phone,
              email: quotation.email
            };
            
            // جلب بيانات طلب الإصلاح إن وجد
            let repair = {};
            if (quotation.repairRequestId) {
              const [repairs] = await db.execute(
                'SELECT * FROM RepairRequest WHERE id = ? AND deletedAt IS NULL',
                [quotation.repairRequestId]
              );
              if (repairs.length > 0) {
                repair = repairs[0];
              }
            }
            
            preparedVariables = await templateService.prepareQuotationVariables(quotation, customer, repair);
          }
        } else if (entityType === 'payment') {
          const [payments] = await db.execute(
            `SELECT p.*, i.id as invoiceId, i.totalAmount, i.amountPaid, i.dueDate, i.currency,
             c.name as customerName, c.firstName, c.phone, c.email
             FROM Payment p
             LEFT JOIN Invoice i ON p.invoiceId = i.id
             LEFT JOIN Customer c ON i.customerId = c.id
             WHERE p.id = ? AND p.deletedAt IS NULL`,
            [entityId]
          );
          
          if (payments.length > 0) {
            const payment = payments[0];
            const invoice = {
              id: payment.invoiceId,
              totalAmount: payment.totalAmount,
              amountPaid: payment.amountPaid,
              dueDate: payment.dueDate,
              currency: payment.currency
            };
            const customer = {
              name: payment.customerName,
              firstName: payment.firstName,
              phone: payment.phone,
              email: payment.email
            };
            
            preparedVariables = await templateService.preparePaymentVariables(payment, invoice, customer);
          }
        }
      } catch (error) {
        console.error('Error preparing variables:', error);
        // نستمر بدون المتغيرات إذا فشل التحضير
      }
    }

    // تحضير الرسالة من القالب إذا لم يتم توفيرها
    let finalMessage = message;
    let finalSubject = options.subject;

    if (!finalMessage && template) {
      const templateContent = await templateService.loadTemplate(template, entityType);
      finalMessage = templateService.render(templateContent, preparedVariables);
    }

    if (!finalMessage) {
      throw new Error('لا يمكن إرسال رسالة فارغة');
    }

    // إعداد subject للبريد الإلكتروني
    if (!finalSubject && entityType === 'invoice') {
      finalSubject = `فاتورة رقم #${entityId} - Fix Zone`;
    } else if (!finalSubject && entityType === 'quotation') {
      finalSubject = `عرض سعر رقم #${entityId} - Fix Zone`;
    } else if (!finalSubject) {
      finalSubject = `رسالة من Fix Zone`;
    }

    const results = {
      entityType,
      entityId,
      customerId,
      channels: {},
      logs: []
    };

    // إرسال عبر كل قناة
    for (const channel of channelsArray) {
      try {
        let channelResult;
        const channelRecipient = recipients[channel] || recipient;
        
        let logData = {
          entityType,
          entityId,
          customerId,
          channel,
          recipient: channelRecipient,
          message: finalMessage,
          template: template || null,
          status: 'pending',
          sentBy: sentBy || null,
          errorMessage: null,
          retryCount: 0,
          metadata: JSON.stringify({})
        };

        // محاولة الإرسال
        if (channel === 'whatsapp') {
          const whatsappRecipient = recipients.whatsapp;
          if (!whatsappRecipient) {
            throw new Error('لا يوجد رقم هاتف للعميل');
          }

          const whatsappResult = await whatsappService.send(whatsappRecipient, finalMessage, {
            preferAPI: options.preferAPI !== false,
            preferWeb: options.preferWeb !== false
          });

          channelResult = {
            success: whatsappResult.success,
            method: whatsappResult.method,
            url: whatsappResult.url,
            messageId: whatsappResult.messageId
          };

          logData.status = whatsappResult.success ? 'sent' : 'failed';
          logData.metadata = JSON.stringify({
            method: whatsappResult.method,
            messageId: whatsappResult.messageId,
            response: whatsappResult.response
          });

        } else if (channel === 'email') {
          const emailRecipient = recipients.email;
          if (!emailRecipient || !emailRecipient.includes('@')) {
            throw new Error('عنوان بريد إلكتروني غير صحيح');
          }

          // إذا كان entityType هو invoice، استخدم sendInvoiceEmail
          let emailResult;
          if (entityType === 'invoice' && entityId) {
            emailResult = await emailService.sendInvoiceEmail(
              entityId,
              emailRecipient,
              {
                subject: finalSubject,
                attachPDF: options.attachPDF !== false,
                ...options
              }
            );
          } else {
            // إرسال عادي
            emailResult = await emailService.sendEmail(
              emailRecipient,
              finalSubject,
              finalMessage,
              {
                isHtml: options.isHtml !== false,
                attachments: options.attachments,
                forceHtml: options.forceHtml
              }
            );
          }

          channelResult = {
            success: emailResult.success,
            messageId: emailResult.messageId,
            accepted: emailResult.accepted,
            rejected: emailResult.rejected
          };

          logData.status = emailResult.success ? 'sent' : 'failed';
          logData.subject = finalSubject;
          logData.metadata = JSON.stringify({
            messageId: emailResult.messageId,
            accepted: emailResult.accepted,
            rejected: emailResult.rejected
          });

        } else {
          throw new Error(`قناة غير مدعومة: ${channel}`);
        }

        // تسجيل محاولة الإرسال
        if (channelResult.success) {
          logData.sentAt = new Date();
          logData.status = 'sent';
        } else {
          logData.status = 'failed';
          logData.errorMessage = channelResult.error || 'فشل في الإرسال';
        }

        const logId = await this.logMessage(logData);
        logData.id = logId;

        results.channels[channel] = channelResult;
        results.logs.push(logData);

      } catch (error) {
        console.error(`Error sending via ${channel}:`, error);

        // تسجيل الخطأ
        const logData = {
          entityType,
          entityId,
          customerId,
          channel,
          recipient,
          message: finalMessage,
          template: template || null,
          status: 'failed',
          sentBy: sentBy || null,
          errorMessage: error.message,
          retryCount: 0,
          metadata: JSON.stringify({ error: error.message, stack: error.stack })
        };

        const logId = await this.logMessage(logData);
        logData.id = logId;

        results.channels[channel] = {
          success: false,
          error: error.message
        };
        results.logs.push(logData);
      }
    }

    // تحديد النجاح العام
    results.success = Object.values(results.channels).some(r => r.success);
    results.hasFailures = Object.values(results.channels).some(r => !r.success);

    return results;
  }

  /**
   * تسجيل محاولة إرسال في قاعدة البيانات
   * @param {object} logData - بيانات السجل
   * @returns {Promise<number>} - معرف السجل
   */
  async logMessage(logData) {
    try {
      const [result] = await db.execute(
        `INSERT INTO MessagingLog (
          entityType, entityId, customerId, channel, recipient,
          message, template, subject, status, sentBy,
          sentAt, errorMessage, retryCount, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logData.entityType,
          logData.entityId,
          logData.customerId || null,
          logData.channel,
          logData.recipient,
          logData.message,
          logData.template || null,
          logData.subject || null,
          logData.status || 'pending',
          logData.sentBy || null,
          logData.sentAt || null,
          logData.errorMessage || null,
          logData.retryCount || 0,
          logData.metadata || '{}'
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error logging message:', error);
      // لا نرمي خطأ هنا لأن الإرسال قد يكون نجح لكن التسجيل فشل
      return null;
    }
  }

  /**
   * تحديث حالة رسالة في السجل
   * @param {number} logId - معرف السجل
   * @param {object} updates - التحديثات
   * @returns {Promise<boolean>} - نجح التحديث
   */
  async updateMessageStatus(logId, updates) {
    try {
      const updateFields = [];
      const updateValues = [];

      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updates.status);
      }

      if (updates.sentAt !== undefined) {
        updateFields.push('sentAt = ?');
        updateValues.push(updates.sentAt);
      }

      if (updates.deliveredAt !== undefined) {
        updateFields.push('deliveredAt = ?');
        updateValues.push(updates.deliveredAt);
      }

      if (updates.readAt !== undefined) {
        updateFields.push('readAt = ?');
        updateValues.push(updates.readAt);
      }

      if (updates.errorMessage !== undefined) {
        updateFields.push('errorMessage = ?');
        updateValues.push(updates.errorMessage);
      }

      if (updates.retryCount !== undefined) {
        updateFields.push('retryCount = ?');
        updateValues.push(updates.retryCount);
      }

      if (updates.metadata !== undefined) {
        updateFields.push('metadata = ?');
        updateValues.push(typeof updates.metadata === 'string' 
          ? updates.metadata 
          : JSON.stringify(updates.metadata));
      }

      if (updateFields.length === 0) {
        return false;
      }

      updateValues.push(logId);

      await db.execute(
        `UPDATE MessagingLog SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      return true;
    } catch (error) {
      console.error('Error updating message status:', error);
      return false;
    }
  }

  /**
   * الحصول على سجل المراسلات
   * @param {object} filters - فلاتر البحث
   * @param {object} pagination - معلومات الصفحات
   * @returns {Promise<object>} - السجلات والعدد الإجمالي
   */
  async getMessageLogs(filters = {}, pagination = {}) {
    try {
      const where = [];
      const params = [];

      if (filters.entityType) {
        where.push('entityType = ?');
        params.push(filters.entityType);
      }

      if (filters.entityId) {
        where.push('entityId = ?');
        params.push(filters.entityId);
      }

      if (filters.customerId) {
        where.push('customerId = ?');
        params.push(filters.customerId);
      }

      if (filters.channel) {
        where.push('channel = ?');
        params.push(filters.channel);
      }

      if (filters.status) {
        where.push('status = ?');
        params.push(filters.status);
      }

      if (filters.recipient) {
        where.push('recipient LIKE ?');
        params.push(`%${filters.recipient}%`);
      }

      if (filters.dateFrom) {
        where.push('createdAt >= ?');
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        where.push('createdAt <= ?');
        params.push(filters.dateTo);
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      // عدد السجلات
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM MessagingLog ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // السجلات مع pagination
      const limit = parseInt(pagination.limit) || 20;
      const offset = parseInt(pagination.offset) || 0;

      // CRITICAL: Use db.execute with LIMIT/OFFSET as integers in the query string (not as placeholders)
      // db.execute works fine when LIMIT/OFFSET are template literals (integers), not ? placeholders
      // This allows us to use parameterized queries for WHERE clause (safe from SQL injection)
      // while still supporting LIMIT/OFFSET properly
      const [logs] = await db.execute(
        `SELECT * FROM MessagingLog ${whereClause} ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}`,
        params
      );

      // تحويل metadata من JSON
      const finalLogs = logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : {}
      }));

      return {
        logs: finalLogs,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      };
    } catch (error) {
      console.error('Error getting message logs:', error);
      throw error;
    }
  }

  /**
   * إعادة محاولة إرسال رسالة فاشلة
   * @param {number} logId - معرف السجل
   * @returns {Promise<object>} - نتيجة إعادة المحاولة
   */
  async retryMessage(logId) {
    try {
      // جلب السجل
      const [logs] = await db.execute(
        'SELECT * FROM MessagingLog WHERE id = ?',
        [logId]
      );

      if (logs.length === 0) {
        throw new Error('السجل غير موجود');
      }

      const log = logs[0];

      if (log.status !== 'failed') {
        throw new Error('يمكن إعادة المحاولة فقط للرسائل الفاشلة');
      }

      // تحديث retryCount
      const newRetryCount = (log.retryCount || 0) + 1;
      await this.updateMessageStatus(logId, {
        retryCount: newRetryCount,
        errorMessage: null
      });

      // إعادة المحاولة
      const result = await this.sendMessage({
        entityType: log.entityType,
        entityId: log.entityId,
        customerId: log.customerId,
        channels: log.channel,
        recipient: log.recipient,
        message: log.message,
        template: log.template,
        sentBy: log.sentBy,
        options: {
          preferAPI: true,
          preferWeb: true
        }
      });

      return result;
    } catch (error) {
      console.error('Error retrying message:', error);
      throw error;
    }
  }

  /**
   * الحصول على إحصائيات المراسلات
   * @param {object} filters - فلاتر البحث
   * @returns {Promise<object>} - الإحصائيات
   */
  async getStats(filters = {}) {
    try {
      const where = [];
      const params = [];

      if (filters.dateFrom) {
        where.push('createdAt >= ?');
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        where.push('createdAt <= ?');
        params.push(filters.dateTo);
      }

      if (filters.channel) {
        where.push('channel = ?');
        params.push(filters.channel);
      }

      if (filters.entityType) {
        where.push('entityType = ?');
        params.push(filters.entityType);
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      // إحصائيات عامة
      const [stats] = await db.execute(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as \`read\`,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
         FROM MessagingLog ${whereClause}`,
        params
      );

      // إحصائيات حسب القناة
      const [channelStats] = await db.execute(
        `SELECT 
          channel,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
          SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as \`read\`
         FROM MessagingLog ${whereClause}
         GROUP BY channel
         ORDER BY total DESC`,
        params
      );

      // إحصائيات حسب نوع الكيان
      const [entityStats] = await db.execute(
        `SELECT 
          entityType,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
          SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered
         FROM MessagingLog ${whereClause}
         GROUP BY entityType
         ORDER BY total DESC`,
        params
      );

      // إحصائيات يومية (آخر 30 يوم)
      const [dailyStats] = await db.execute(
        `SELECT 
          DATE(createdAt) as date,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
         FROM MessagingLog ${whereClause}
         GROUP BY DATE(createdAt)
         ORDER BY date DESC
         LIMIT 30`,
        params
      );

      // إحصائيات ساعية (آخر 24 ساعة)
      const hourlyWhereClause = whereClause 
        ? `${whereClause} AND createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`
        : `WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`;
      
      const [hourlyStats] = await db.execute(
        `SELECT 
          DATE_FORMAT(createdAt, '%Y-%m-%d %H:00:00') as hour,
          COUNT(*) as total,
          SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent,
          SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
         FROM MessagingLog ${hourlyWhereClause}
         GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d %H:00:00')
         ORDER BY hour DESC`,
        params
      );

      // أسباب الفشل (Top 10)
      const failureWhereClause = whereClause 
        ? `${whereClause} AND status = 'failed' AND errorMessage IS NOT NULL AND errorMessage != ''`
        : `WHERE status = 'failed' AND errorMessage IS NOT NULL AND errorMessage != ''`;
      
      const [failureReasons] = await db.execute(
        `SELECT 
          errorMessage,
          COUNT(*) as count
         FROM MessagingLog ${failureWhereClause}
         GROUP BY errorMessage
         ORDER BY count DESC
         LIMIT 10`,
        params
      );

      const total = parseInt(stats[0].total) || 0;
      const sent = parseInt(stats[0].sent) || 0;
      const failed = parseInt(stats[0].failed) || 0;
      const delivered = parseInt(stats[0].delivered) || 0;
      const read = parseInt(stats[0].read) || 0;
      const pending = parseInt(stats[0].pending) || 0;
      const successRate = total > 0 ? ((sent / total) * 100).toFixed(2) : 0;
      const failureRate = total > 0 ? ((failed / total) * 100).toFixed(2) : 0;

      return {
        summary: {
          total,
          sent,
          failed,
          delivered,
          read,
          pending,
          successRate: parseFloat(successRate),
          failureRate: parseFloat(failureRate)
        },
        byChannel: channelStats.map(s => ({
          channel: s.channel,
          total: parseInt(s.total) || 0,
          sent: parseInt(s.sent) || 0,
          failed: parseInt(s.failed) || 0,
          delivered: parseInt(s.delivered) || 0,
          read: parseInt(s.read) || 0,
          successRate: s.total > 0 ? parseFloat(((s.sent / s.total) * 100).toFixed(2)) : 0
        })),
        byEntity: entityStats.map(s => ({
          entityType: s.entityType,
          total: parseInt(s.total) || 0,
          sent: parseInt(s.sent) || 0,
          failed: parseInt(s.failed) || 0,
          delivered: parseInt(s.delivered) || 0,
          successRate: s.total > 0 ? parseFloat(((s.sent / s.total) * 100).toFixed(2)) : 0
        })),
        daily: dailyStats.map(s => ({
          date: s.date,
          total: parseInt(s.total) || 0,
          sent: parseInt(s.sent) || 0,
          failed: parseInt(s.failed) || 0
        })),
        hourly: hourlyStats.map(s => ({
          hour: s.hour,
          total: parseInt(s.total) || 0,
          sent: parseInt(s.sent) || 0,
          failed: parseInt(s.failed) || 0
        })),
        failureReasons: failureReasons.map(s => ({
          reason: s.errorMessage,
          count: parseInt(s.count) || 0
        }))
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }
}

module.exports = new MessagingService();

