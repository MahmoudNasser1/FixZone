import api from './api';

/**
 * Task Service
 * خدمة إدارة المهام للفنيين
 */

/**
 * إنشاء مهمة جديدة
 * POST /api/tasks
 */
export async function createTask(taskData) {
  try {
    const response = await api.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
    return response;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

/**
 * جلب جميع المهام
 * GET /api/tasks
 */
export async function getTasks(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const endpoint = `/tasks${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
}

/**
 * جلب مهمة محددة
 * GET /api/tasks/:id
 */
export async function getTask(id) {
  try {
    const response = await api.request(`/tasks/${id}`);
    return response;
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
}

/**
 * تحديث مهمة
 * PUT /api/tasks/:id
 */
export async function updateTask(id, taskData) {
  try {
    const response = await api.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
    return response;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

/**
 * حذف مهمة
 * DELETE /api/tasks/:id
 */
export async function deleteTask(id) {
  try {
    const response = await api.request(`/tasks/${id}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

/**
 * إحصائيات المهام
 * GET /api/tasks/stats/summary
 */
export async function getTaskStats(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const endpoint = `/tasks/stats/summary${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error getting task stats:', error);
    throw error;
  }
}

