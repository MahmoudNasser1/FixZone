import api from './api';

/**
 * Time Tracking Service
 * خدمة تتبع الوقت للفنيين
 */

/**
 * بدء تتبع الوقت
 * POST /api/time-tracking/start
 */
export async function startTimeTracking(repairId = null, taskId = null) {
  try {
    const response = await api.request('/time-tracking/start', {
      method: 'POST',
      body: JSON.stringify({ repairId, taskId })
    });
    return response;
  } catch (error) {
    console.error('Error starting time tracking:', error);
    throw error;
  }
}

/**
 * إيقاف تتبع الوقت
 * POST /api/time-tracking/:id/stop
 */
export async function stopTimeTracking(trackingId) {
  try {
    const response = await api.request(`/time-tracking/${trackingId}/stop`, {
      method: 'POST'
    });
    return response;
  } catch (error) {
    console.error('Error stopping time tracking:', error);
    throw error;
  }
}

/**
 * جلب التتبع النشط
 * GET /api/time-tracking/active
 */
export async function getActiveTracking() {
  try {
    const response = await api.request('/time-tracking/active');
    return response;
  } catch (error) {
    console.error('Error getting active tracking:', error);
    throw error;
  }
}

/**
 * جلب جميع التتبع للفني
 * GET /api/time-tracking
 */
export async function getTimeTrackings(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const endpoint = `/time-tracking${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error getting time trackings:', error);
    throw error;
  }
}

/**
 * حساب الوقت اليومي
 * GET /api/time-tracking/daily-total
 */
export async function getDailyTotal(date = null) {
  try {
    const endpoint = `/time-tracking/daily-total${date ? `?date=${date}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error getting daily total:', error);
    throw error;
  }
}

/**
 * طلب تعديل الوقت
 * POST /api/time-tracking/:id/adjust
 */
export async function requestTimeAdjustment(trackingId, newDuration, reason) {
  try {
    const response = await api.request(`/time-tracking/${trackingId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ newDuration, reason })
    });
    return response;
  } catch (error) {
    console.error('Error requesting time adjustment:', error);
    throw error;
  }
}

