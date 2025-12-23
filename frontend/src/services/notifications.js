import { getToken, API_BASE_URL } from './api';

// 알림 목록 조회
export async function fetchNotifications(unreadOnly = false, limit = 50) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const params = new URLSearchParams();
  if (unreadOnly) params.append('unreadOnly', 'true');
  if (limit) params.append('limit', limit);

  const response = await fetch(
    `${API_BASE_URL}/api/notifications?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch notifications');
  }

  return response.json();
}

// 알림 읽음 처리
export async function markNotificationAsRead(notificationId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/notifications/${notificationId}/read`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to mark notification as read');
  }

  return response.json();
}

// 모든 알림 읽음 처리
export async function markAllNotificationsAsRead() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/notifications/read-all`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to mark all notifications as read');
  }

  return response.json();
}

// 알림 삭제
export async function deleteNotification(notificationId) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/notifications/${notificationId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete notification');
  }

  return response.json();
}

// 모든 알림 삭제
export async function deleteAllNotifications() {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/notifications`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete all notifications');
  }

  return response.json();
}

// 알림 생성 (Admin용)
export async function createNotification(notificationData) {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(
    `${API_BASE_URL}/api/notifications`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationData)
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create notification');
  }

  return response.json();
}
