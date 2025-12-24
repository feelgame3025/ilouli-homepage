// Google Calendar API 서비스 (백엔드 OAuth 연동)
// 백엔드에서 토큰을 관리하여 영구적인 연결 유지

import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { getAuthHeaders } from './api';

const CALENDAR_API = `${API_BASE_URL}${API_ENDPOINTS.CALENDAR}`;

/**
 * Google 연결 상태 확인
 * @returns {Promise<{connected: boolean, reason?: string}>}
 */
export const checkGoogleConnectionStatus = async () => {
  try {
    const response = await fetch(`${CALENDAR_API}/auth/status`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to check status');
    }

    return await response.json();
  } catch (err) {
    console.error('Error checking Google connection status:', err);
    return { connected: false };
  }
};

/**
 * Google 로그인 (OAuth URL 가져와서 리다이렉트)
 * 백엔드에서 Authorization Code flow를 사용하여 refresh_token을 저장
 */
export const signInToGoogle = async () => {
  try {
    const response = await fetch(`${CALENDAR_API}/auth/url`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to get auth URL');
    }

    const { url } = await response.json();

    // OAuth 페이지로 리다이렉트
    window.location.href = url;
  } catch (err) {
    console.error('Error getting Google auth URL:', err);
    throw err;
  }
};

/**
 * Google 로그아웃 (백엔드에서 토큰 삭제)
 */
export const signOutFromGoogle = async () => {
  try {
    const response = await fetch(`${CALENDAR_API}/auth/disconnect`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to disconnect');
    }

    return await response.json();
  } catch (err) {
    console.error('Error disconnecting from Google:', err);
    throw err;
  }
};

/**
 * Google 연결 상태 확인 (동기식, localStorage 기반 - 레거시 호환)
 * 실제 상태는 백엔드에서 확인해야 함
 */
export const isGoogleConnected = () => {
  // 레거시 호환용 - 실제로는 checkGoogleConnectionStatus() 사용 권장
  return false;
};

/**
 * Google 캘린더에서 이벤트 가져오기
 */
export const fetchGoogleEvents = async (timeMin, timeMax) => {
  try {
    const params = new URLSearchParams();
    if (timeMin) params.append('timeMin', timeMin);
    if (timeMax) params.append('timeMax', timeMax);

    const response = await fetch(`${CALENDAR_API}/events?${params}`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        const authError = new Error(errorData.error || 'Unauthorized');
        authError.status = 401;
        authError.needsReconnect = errorData.needsReconnect;
        throw authError;
      }
      throw new Error(errorData.error || 'Failed to fetch events');
    }

    const data = await response.json();
    return data.events;
  } catch (err) {
    console.error('Error fetching Google events:', err);
    throw err;
  }
};

/**
 * Google 캘린더에 이벤트 추가
 */
export const addGoogleEvent = async (eventData) => {
  try {
    const response = await fetch(`${CALENDAR_API}/events`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add event');
    }

    const data = await response.json();
    return data.event;
  } catch (err) {
    console.error('Error adding Google event:', err);
    throw err;
  }
};

/**
 * Google 캘린더에서 이벤트 삭제
 */
export const deleteGoogleEvent = async (eventId) => {
  try {
    const response = await fetch(`${CALENDAR_API}/events/${eventId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete event');
    }

    return await response.json();
  } catch (err) {
    console.error('Error deleting Google event:', err);
    throw err;
  }
};

/**
 * Google 캘린더에서 이벤트 수정
 */
export const updateGoogleEvent = async (eventId, eventData) => {
  try {
    const response = await fetch(`${CALENDAR_API}/events/${eventId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update event');
    }

    const data = await response.json();
    return data.event;
  } catch (err) {
    console.error('Error updating Google event:', err);
    throw err;
  }
};

// 레거시 호환용 빈 함수들 (프론트엔드 OAuth 관련)
export const loadGoogleScripts = () => Promise.resolve();
export const restoreGoogleSession = () => Promise.resolve(false);
export const silentTokenRefresh = () => Promise.resolve(false);
