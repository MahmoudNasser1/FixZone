import api from './api';

/**
 * Note Service
 * خدمة الملاحظات للفنيين
 */

/**
 * إنشاء ملاحظة جديدة
 * POST /api/notes
 */
export async function createNote(noteData) {
  try {
    const response = await api.request('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
    return response;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
}

/**
 * جلب جميع الملاحظات
 * GET /api/notes
 */
export async function getNotes(filters = {}) {
  try {
    const query = new URLSearchParams(filters).toString();
    const endpoint = `/notes${query ? `?${query}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error getting notes:', error);
    throw error;
  }
}

/**
 * جلب ملاحظة محددة
 * GET /api/notes/:id
 */
export async function getNote(id) {
  try {
    const response = await api.request(`/notes/${id}`);
    return response;
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
}

/**
 * تحديث ملاحظة
 * PUT /api/notes/:id
 */
export async function updateNote(id, noteData) {
  try {
    const response = await api.request(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(noteData)
    });
    return response;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
}

/**
 * حذف ملاحظة
 * DELETE /api/notes/:id
 */
export async function deleteNote(id) {
  try {
    const response = await api.request(`/notes/${id}`, {
      method: 'DELETE'
    });
    return response;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
}

/**
 * جلب التذكيرات
 * GET /api/notes/reminders/list
 */
export async function getReminders(date = null) {
  try {
    const endpoint = `/notes/reminders/list${date ? `?date=${date}` : ''}`;
    const response = await api.request(endpoint);
    return response;
  } catch (error) {
    console.error('Error getting reminders:', error);
    throw error;
  }
}



