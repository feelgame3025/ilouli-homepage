import { useState, useEffect, useCallback } from 'react';
import {
  loadGoogleScripts,
  signInToGoogle,
  signOutFromGoogle,
  restoreGoogleSession,
  silentTokenRefresh,
  fetchGoogleEvents,
  addGoogleEvent,
  deleteGoogleEvent,
  updateGoogleEvent
} from '../services/googleCalendar';

/**
 * Google Calendar 연동을 위한 커스텀 훅
 *
 * @returns {Object} Google Calendar 상태 및 메서드
 * @property {boolean} isConnected - Google 계정 연결 상태
 * @property {boolean} loading - 로딩 상태
 * @property {string|null} error - 에러 메시지
 * @property {Array} events - Google 이벤트 목록
 * @property {Function} connect - Google 계정 연결
 * @property {Function} disconnect - Google 계정 연결 해제
 * @property {Function} refresh - 이벤트 새로고침
 * @property {Function} addEvent - 이벤트 추가
 * @property {Function} updateEvent - 이벤트 수정
 * @property {Function} deleteEvent - 이벤트 삭제
 */
export const useGoogleCalendar = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);

  // Google API 초기화 및 세션 복원
  useEffect(() => {
    const initGoogle = async () => {
      try {
        await loadGoogleScripts();
        const restored = await restoreGoogleSession();
        if (restored) {
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Failed to init Google API:', err);
        setError('Google API 초기화 실패');
      }
    };
    initGoogle();
  }, []);

  // 이벤트 새로고침
  const refresh = useCallback(async (retryCount = 0) => {
    if (!isConnected) return;

    setLoading(true);
    setError(null);
    try {
      const googleEvents = await fetchGoogleEvents();
      setEvents(googleEvents);
    } catch (err) {
      console.error('Failed to fetch Google events:', err);

      // 토큰 만료 시 조용히 갱신 시도 (최대 1회)
      if ((err.status === 401 || err.result?.error?.code === 401) && retryCount === 0) {
        console.log('Token expired, attempting silent refresh...');
        const refreshed = await silentTokenRefresh();
        if (refreshed) {
          // 갱신 성공 - 다시 시도
          setLoading(false);
          return refresh(1);
        } else {
          // 갱신 실패 - 연결 해제
          setIsConnected(false);
          signOutFromGoogle();
          setError('Google 연결이 만료되었습니다. 다시 연결해주세요.');
        }
      } else {
        setError('Google 캘린더 동기화 실패');
      }
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  // 연결 상태 변경 시 이벤트 새로고침
  useEffect(() => {
    if (isConnected) {
      refresh();
    } else {
      setEvents([]);
    }
  }, [isConnected, refresh]);

  // Google 계정 연결
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await signInToGoogle();
      setIsConnected(true);
    } catch (err) {
      console.error('Google sign in failed:', err);
      setError('Google 로그인 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  // Google 계정 연결 해제
  const disconnect = useCallback(() => {
    signOutFromGoogle();
    setIsConnected(false);
    setEvents([]);
    setError(null);
  }, []);

  // 이벤트 추가
  const addEvent = useCallback(async (eventData) => {
    if (!isConnected) {
      throw new Error('Google 계정이 연결되지 않았습니다');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await addGoogleEvent(eventData);
      await refresh();
      return result;
    } catch (err) {
      console.error('Failed to add Google event:', err);
      setError('이벤트 추가 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, refresh]);

  // 이벤트 수정
  const updateEvent = useCallback(async (eventId, eventData) => {
    if (!isConnected) {
      throw new Error('Google 계정이 연결되지 않았습니다');
    }

    setLoading(true);
    setError(null);
    try {
      const result = await updateGoogleEvent(eventId, eventData);
      await refresh();
      return result;
    } catch (err) {
      console.error('Failed to update Google event:', err);
      setError('이벤트 수정 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, refresh]);

  // 이벤트 삭제
  const deleteEvent = useCallback(async (eventId) => {
    if (!isConnected) {
      throw new Error('Google 계정이 연결되지 않았습니다');
    }

    setLoading(true);
    setError(null);
    try {
      await deleteGoogleEvent(eventId);
      await refresh();
    } catch (err) {
      console.error('Failed to delete Google event:', err);
      setError('이벤트 삭제 실패');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isConnected, refresh]);

  return {
    isConnected,
    loading,
    error,
    events,
    connect,
    disconnect,
    refresh,
    addEvent,
    updateEvent,
    deleteEvent
  };
};
