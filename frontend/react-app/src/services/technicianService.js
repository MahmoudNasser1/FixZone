import api from './api';

/**
 * Technician Service
 * مجموعة من الدوال للتواصل مع Backend APIs الخاصة بالفنيين
 */

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

