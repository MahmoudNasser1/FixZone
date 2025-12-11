/**
 * Technician Module Validators
 * التحقق من صحة البيانات لمودول الفنيين
 */

/**
 * التحقق من بيانات تتبع الوقت
 */
const validateTimeTracking = (data) => {
  const errors = [];

  if (data.repairId !== undefined && data.repairId !== null) {
    if (!Number.isInteger(parseInt(data.repairId)) || parseInt(data.repairId) <= 0) {
      errors.push('رقم الإصلاح غير صحيح');
    }
  }

  if (data.taskId !== undefined && data.taskId !== null) {
    if (!Number.isInteger(parseInt(data.taskId)) || parseInt(data.taskId) <= 0) {
      errors.push('رقم المهمة غير صحيح');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * التحقق من بيانات المهمة
 */
const validateTask = (data) => {
  const errors = [];

  if (!data.title || data.title.trim().length < 2) {
    errors.push('عنوان المهمة مطلوب ويجب أن يكون أكثر من حرفين');
  }

  if (data.title && data.title.length > 255) {
    errors.push('عنوان المهمة طويل جداً (الحد الأقصى 255 حرف)');
  }

  if (data.priority && !['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
    errors.push('الأولوية غير صحيحة');
  }

  if (data.status && !['todo', 'in_progress', 'review', 'done', 'cancelled'].includes(data.status)) {
    errors.push('الحالة غير صحيحة');
  }

  if (data.taskType && !['repair', 'general', 'recurring'].includes(data.taskType)) {
    errors.push('نوع المهمة غير صحيح');
  }

  if (data.estimatedDuration !== undefined && data.estimatedDuration !== null) {
    const duration = parseInt(data.estimatedDuration);
    if (isNaN(duration) || duration < 0) {
      errors.push('المدة المتوقعة يجب أن تكون رقماً موجباً');
    }
  }

  if (data.repairId !== undefined && data.repairId !== null) {
    if (!Number.isInteger(parseInt(data.repairId)) || parseInt(data.repairId) <= 0) {
      errors.push('رقم الإصلاح غير صحيح');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * التحقق من بيانات الملاحظة
 */
const validateNote = (data) => {
  const errors = [];

  if (!data.content || data.content.trim().length < 1) {
    errors.push('محتوى الملاحظة مطلوب');
  }

  if (data.content && data.content.length > 10000) {
    errors.push('محتوى الملاحظة طويل جداً (الحد الأقصى 10000 حرف)');
  }

  if (data.noteType && !['general', 'device', 'task'].includes(data.noteType)) {
    errors.push('نوع الملاحظة غير صحيح');
  }

  if (data.priority && !['low', 'medium', 'high'].includes(data.priority)) {
    errors.push('الأولوية غير صحيحة');
  }

  if (data.deviceId !== undefined && data.deviceId !== null) {
    if (!Number.isInteger(parseInt(data.deviceId)) || parseInt(data.deviceId) <= 0) {
      errors.push('رقم الجهاز غير صحيح');
    }
  }

  if (data.repairId !== undefined && data.repairId !== null) {
    if (!Number.isInteger(parseInt(data.repairId)) || parseInt(data.repairId) <= 0) {
      errors.push('رقم الإصلاح غير صحيح');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * التحقق من بيانات التقرير
 */
const validateReport = (data) => {
  const errors = [];

  if (!data.repairId) {
    errors.push('رقم الإصلاح مطلوب');
  } else if (!Number.isInteger(parseInt(data.repairId)) || parseInt(data.repairId) <= 0) {
    errors.push('رقم الإصلاح غير صحيح');
  }

  if (data.reportType && !['quick', 'detailed'].includes(data.reportType)) {
    errors.push('نوع التقرير غير صحيح');
  }

  if (data.timeSpent !== undefined && data.timeSpent !== null) {
    const time = parseInt(data.timeSpent);
    if (isNaN(time) || time < 0) {
      errors.push('الوقت المستغرق يجب أن يكون رقماً موجباً');
    }
  }

  if (data.partsUsed && !Array.isArray(data.partsUsed)) {
    errors.push('الأجزاء المستخدمة يجب أن تكون مصفوفة');
  }

  if (data.images && !Array.isArray(data.images)) {
    errors.push('الصور يجب أن تكون مصفوفة');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateTimeTracking,
  validateTask,
  validateNote,
  validateReport
};

