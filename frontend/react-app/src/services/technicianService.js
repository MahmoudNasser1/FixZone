import api from './api';

/**
 * Technician Service
 * مجموعة من الدوال للتواصل مع Backend APIs الخاصة بالفنيين
 */

// Simple cache for API responses (5 minutes TTL)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (endpoint, params = {}) => {
  return `${endpoint}_${JSON.stringify(params)}`;
};

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCached = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

/**
 * الحصول على جميع الفنيين
 * GET /api/technicians
 */
export async function getAllTechnicians(useCache = true) {
  try {
    const cacheKey = getCacheKey('/technicians');
    if (useCache) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }
    
    const response = await api.request('/technicians');
    if (useCache && response.success) {
      setCached(cacheKey, response);
    }
    return response;
  } catch (error) {
    console.error('Error fetching technicians:', error);
    throw error;
  }
}

/**
 * الحصول على فني محدد
 * GET /api/technicians/:id
 */
export async function getTechnicianById(id, useCache = true) {
  try {
    const cacheKey = getCacheKey(`/technicians/${id}`);
    if (useCache) {
      const cached = getCached(cacheKey);
      if (cached) return cached;
    }
    
    const response = await api.request(`/technicians/${id}`);
    if (useCache && response.success) {
      setCached(cacheKey, response);
    }
    return response;
  } catch (error) {
    console.error('Error fetching technician:', error);
    throw error;
  }
}

/**
 * إنشاء فني جديد
 * POST /api/technicians
 */
export async function createTechnician(technicianData) {
  try {
    const response = await api.request('/technicians', {
      method: 'POST',
      body: JSON.stringify(technicianData),
    });
    return response;
  } catch (error) {
    console.error('Error creating technician:', error);
    throw error;
  }
}

/**
 * تحديث فني
 * PUT /api/technicians/:id
 */
export async function updateTechnician(id, technicianData) {
  try {
    const response = await api.request(`/technicians/${id}`, {
      method: 'PUT',
      body: JSON.stringify(technicianData),
    });
    return response;
  } catch (error) {
    console.error('Error updating technician:', error);
    throw error;
  }
}

/**
 * حذف فني
 * DELETE /api/technicians/:id
 */
export async function deleteTechnician(id) {
  try {
    const response = await api.request(`/technicians/${id}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting technician:', error);
    throw error;
  }
}

/**
 * الحصول على إحصائيات الفني
 * GET /api/technicians/:id/stats
 */
export async function getTechnicianStats(id) {
  try {
    const response = await api.request(`/technicians/${id}/stats`);
    return response;
  } catch (error) {
    console.error('Error fetching technician stats:', error);
    throw error;
  }
}

/**
 * الحصول على أداء الفني
 * GET /api/technicians/:id/performance
 */
export async function getTechnicianPerformance(id, params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/technicians/${id}/performance${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching technician performance:', error);
    throw error;
  }
}

/**
 * الحصول على جدول الفني
 * GET /api/technicians/:id/schedule
 */
export async function getTechnicianSchedule(id, params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/technicians/${id}/schedule${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching technician schedule:', error);
    throw error;
  }
}

// ==================== Skills Functions ====================

/**
 * الحصول على مهارات الفني
 * GET /api/technicians/:id/skills
 */
export async function getTechnicianSkills(id) {
  try {
    const response = await api.request(`/technicians/${id}/skills`);
    return response;
  } catch (error) {
    console.error('Error fetching technician skills:', error);
    throw error;
  }
}

/**
 * إضافة مهارة للفني
 * POST /api/technicians/:id/skills
 */
export async function addSkill(id, skillData) {
  try {
    const response = await api.request(`/technicians/${id}/skills`, {
      method: 'POST',
      body: JSON.stringify(skillData),
    });
    return response;
  } catch (error) {
    console.error('Error adding skill:', error);
    throw error;
  }
}

/**
 * تحديث مهارة
 * PUT /api/technicians/:id/skills/:skillId
 */
export async function updateSkill(id, skillId, skillData) {
  try {
    const response = await api.request(`/technicians/${id}/skills/${skillId}`, {
      method: 'PUT',
      body: JSON.stringify(skillData),
    });
    return response;
  } catch (error) {
    console.error('Error updating skill:', error);
    throw error;
  }
}

/**
 * حذف مهارة
 * DELETE /api/technicians/:id/skills/:skillId
 */
export async function deleteSkill(id, skillId) {
  try {
    const response = await api.request(`/technicians/${id}/skills/${skillId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting skill:', error);
    throw error;
  }
}

// ==================== Repairs Functions ====================

/**
 * الحصول على إصلاحات الفني
 * GET /api/technicians/:id/repairs
 */
export async function getTechnicianRepairs(id, filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const endpoint = `/technicians/${id}/repairs${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching technician repairs:', error);
    throw error;
  }
}

/**
 * الحصول على الإصلاحات النشطة
 * GET /api/technicians/:id/repairs/active
 */
export async function getActiveRepairs(id) {
  try {
    const response = await api.request(`/technicians/${id}/repairs/active`);
    return response;
  } catch (error) {
    console.error('Error fetching active repairs:', error);
    throw error;
  }
}

/**
 * تعيين إصلاح للفني
 * POST /api/technicians/:id/repairs/:repairId/assign
 */
export async function assignRepair(id, repairId, role = 'primary') {
  try {
    const response = await api.request(`/technicians/${id}/repairs/${repairId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    return response;
  } catch (error) {
    console.error('Error assigning repair:', error);
    throw error;
  }
}

/**
 * إلغاء تعيين إصلاح
 * DELETE /api/technicians/:id/repairs/:repairId/unassign
 */
export async function unassignRepair(id, repairId) {
  try {
    const response = await api.request(`/technicians/${id}/repairs/${repairId}/unassign`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error unassigning repair:', error);
    throw error;
  }
}

/**
 * تحديث حالة تعيين الإصلاح
 * PUT /api/technicians/:id/repairs/:repairId/status
 */
export async function updateRepairStatus(id, repairId, statusData) {
  try {
    const response = await api.request(`/technicians/${id}/repairs/${repairId}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData),
    });
    return response;
  } catch (error) {
    console.error('Error updating repair status:', error);
    throw error;
  }
}

// ==================== Performance Functions ====================

/**
 * الحصول على تقييمات الفني
 * GET /api/technicians/:id/evaluations
 */
export async function getTechnicianEvaluations(id, filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const endpoint = `/technicians/${id}/evaluations${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    throw error;
  }
}

/**
 * تقييم الفني
 * POST /api/technicians/:id/performance/evaluate
 */
export async function evaluateTechnician(id, evaluationData) {
  try {
    const response = await api.request(`/technicians/${id}/performance/evaluate`, {
      method: 'POST',
      body: JSON.stringify(evaluationData),
    });
    return response;
  } catch (error) {
    console.error('Error evaluating technician:', error);
    throw error;
  }
}

/**
 * الحصول على إحصائيات الأداء
 * GET /api/technicians/:id/performance/stats
 */
export async function getPerformanceStats(id) {
  try {
    const response = await api.request(`/technicians/${id}/performance/stats`);
    return response;
  } catch (error) {
    console.error('Error fetching performance stats:', error);
    throw error;
  }
}

// ==================== Schedule Functions ====================

/**
 * جدولة مهمة
 * POST /api/technicians/:id/schedule
 */
export async function scheduleRepair(id, scheduleData) {
  try {
    const response = await api.request(`/technicians/${id}/schedule`, {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
    return response;
  } catch (error) {
    console.error('Error scheduling repair:', error);
    throw error;
  }
}

/**
 * تحديث الجدولة
 * PUT /api/technicians/:id/schedule/:scheduleId
 */
export async function updateSchedule(id, scheduleId, scheduleData) {
  try {
    const response = await api.request(`/technicians/${id}/schedule/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    });
    return response;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw error;
  }
}

/**
 * حذف من الجدول
 * DELETE /api/technicians/:id/schedule/:scheduleId
 */
export async function deleteSchedule(id, scheduleId) {
  try {
    const response = await api.request(`/technicians/${id}/schedule/${scheduleId}`, {
      method: 'DELETE',
    });
    return response;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw error;
  }
}

// ==================== Wages Functions ====================

/**
 * الحصول على أجور الفني
 * GET /api/technicians/:id/wages
 */
export async function getTechnicianWages(id, filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const endpoint = `/technicians/${id}/wages${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching wages:', error);
    throw error;
  }
}

/**
 * إضافة أجر
 * POST /api/technicians/:id/wages
 */
export async function createWage(id, wageData) {
  try {
    const response = await api.request(`/technicians/${id}/wages`, {
      method: 'POST',
      body: JSON.stringify(wageData),
    });
    return response;
  } catch (error) {
    console.error('Error creating wage:', error);
    throw error;
  }
}

/**
 * حساب الأجور تلقائياً
 * POST /api/technicians/:id/wages/calculate
 */
export async function calculateWages(id, period) {
  try {
    const response = await api.request(`/technicians/${id}/wages/calculate`, {
      method: 'POST',
      body: JSON.stringify(period),
    });
    return response;
  } catch (error) {
    console.error('Error calculating wages:', error);
    throw error;
  }
}

/**
 * تحديث أجر
 * PUT /api/technicians/:id/wages/:wageId
 */
export async function updateWage(id, wageId, wageData) {
  try {
    const response = await api.request(`/technicians/${id}/wages/${wageId}`, {
      method: 'PUT',
      body: JSON.stringify(wageData),
    });
    return response;
  } catch (error) {
    console.error('Error updating wage:', error);
    throw error;
  }
}

/**
 * الحصول على Dashboard الفني (إحصائيات)
 * GET /api/tech/dashboard
 */
export async function getTechDashboard() {
  try {
    const response = await api.request('/tech/dashboard');
    return response;
  } catch (error) {
    console.error('Error fetching tech dashboard:', error);
    throw error;
  }
}

/**
 * الحصول على قائمة الأجهزة الخاصة بالفني
 * GET /api/tech/jobs
 * @param {Object} params - Filters & Search params
 * @param {string} params.status - Filter by status (optional)
 * @param {string} params.search - Search term (optional)
 */
export async function getTechJobs(params = {}) {
  try {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/tech/jobs${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error fetching tech jobs:', error);
    throw error;
  }
}

/**
 * الحصول على تفاصيل جهاز واحد
 * GET /api/tech/jobs/:id
 * @param {number|string} id - Job ID
 */
export async function getTechJobDetails(id) {
  try {
    const response = await api.request(`/tech/jobs/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching tech job details:', error);
    throw error;
  }
}

/**
 * تحديث حالة جهاز
 * PUT /api/tech/jobs/:id/status
 * @param {number|string} id - Job ID
 * @param {Object} statusPayload
 * @param {string} statusPayload.status - New status
 * @param {string} statusPayload.notes - Optional notes
 */
export async function updateTechJobStatus(id, statusPayload) {
  try {
    const response = await api.request(`/tech/jobs/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusPayload),
    });
    return response;
  } catch (error) {
    console.error('Error updating tech job status:', error);
    throw error;
  }
}

/**
 * إضافة ملاحظة في Timeline
 * POST /api/tech/jobs/:id/notes
 * @param {number|string} id - Job ID
 * @param {Object} notePayload
 * @param {string} notePayload.note - Note content
 */
export async function addTechJobNote(id, notePayload) {
  try {
    const response = await api.request(`/tech/jobs/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(notePayload),
    });
    return response;
  } catch (error) {
    console.error('Error adding tech job note:', error);
    throw error;
  }
}

/**
 * رفع صور/فيديو لجهاز
 * POST /api/tech/jobs/:id/media
 * @param {number|string} id - Job ID
 * @param {Object} mediaData - Media data (fileUrl, fileType, category, description)
 */
export async function uploadTechJobMedia(id, mediaData) {
  try {
    const response = await api.request(`/tech/jobs/${id}/media`, {
      method: 'POST',
      body: JSON.stringify(mediaData),
    });
    return response;
  } catch (error) {
    console.error('Error uploading tech job media:', error);
    throw error;
  }
}

/**
 * جلب الوسائط الخاصة بجهاز
 * GET /api/tech/jobs/:id/media
 * @param {number|string} id - Job ID
 */
export async function getTechJobMedia(id) {
  try {
    const response = await api.request(`/tech/jobs/${id}/media`);
    return response;
  } catch (error) {
    console.error('Error fetching tech job media:', error);
    throw error;
  }
}

/**
 * طلب قطع غيار (سيتم تنفيذه لاحقاً)
 * POST /api/tech/parts-request
 * @param {Object} requestPayload
 */
export async function requestSpareParts(requestPayload) {
  try {
    const response = await api.request('/tech/parts-request', {
      method: 'POST',
      body: JSON.stringify(requestPayload),
    });
    return response;
  } catch (error) {
    console.error('Error requesting spare parts:', error);
    throw error;
  }
}

/**
 * الحصول على حالة طلب قطع غيار (سيتم تنفيذه لاحقاً)
 * GET /api/tech/parts-request/:id
 * @param {number|string} id - Request ID
 */
export async function getPartsRequestStatus(id) {
  try {
    const response = await api.request(`/tech/parts-request/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching parts request status:', error);
    throw error;
  }
}

export default {
  // CRUD Operations
  getAllTechnicians,
  getTechnicianById,
  createTechnician,
  updateTechnician,
  deleteTechnician,
  // Stats & Performance
  getTechnicianStats,
  getTechnicianPerformance,
  getTechnicianSchedule,
  // Skills
  getTechnicianSkills,
  addSkill,
  updateSkill,
  deleteSkill,
  // Repairs
  getTechnicianRepairs,
  getActiveRepairs,
  assignRepair,
  unassignRepair,
  updateRepairStatus,
  // Performance & Evaluations
  getTechnicianEvaluations,
  evaluateTechnician,
  getPerformanceStats,
  // Schedule
  scheduleRepair,
  updateSchedule,
  deleteSchedule,
  // Wages
  getTechnicianWages,
  createWage,
  calculateWages,
  updateWage,
  // Tech Dashboard & Jobs (existing)
  getTechDashboard,
  getTechJobs,
  getTechJobDetails,
  updateTechJobStatus,
  addTechJobNote,
  uploadTechJobMedia,
  getTechJobMedia,
  requestSpareParts,
  getPartsRequestStatus,
};

