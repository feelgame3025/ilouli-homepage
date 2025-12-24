import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  checkGoogleConnectionStatus,
  signInToGoogle,
  signOutFromGoogle,
  fetchGoogleEvents,
  addGoogleEvent,
  deleteGoogleEvent,
  updateGoogleEvent
} from '../services/googleCalendar';

/**
 * Google Calendar 연동을 위한 커스텀 훅 (백엔드 OAuth)
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // OAuth 콜백 처리 및 연결 상태 확인
  useEffect(() => {
    const checkConnection = async () => {
      setLoading(true);
      try {
        // URL 파라미터 확인 (OAuth 콜백)
        const searchParams = new URLSearchParams(location.search);
        const connected = searchParams.get('connected');
        const oauthError = searchParams.get('error');

        if (connected === 'true') {
          // OAuth 성공
          setIsConnected(true);
          setError(null);
          // URL에서 파라미터 제거
          navigate(location.pathname, { replace: true });
        } else if (oauthError) {
          // OAuth 에러
          let errorMessage = 'Google 연결 실패';
          switch (oauthError) {
            case 'access_denied':
              errorMessage = 'Google 연결이 취소되었습니다.';
              break;
            case 'no_refresh_token':
              errorMessage = '권한을 다시 확인해주세요.';
              break;
            case 'token_exchange_failed':
              errorMessage = '인증 처리 중 오류가 발생했습니다.';
              break;
            default:
              errorMessage = `오류: ${oauthError}`;
          }
          setError(errorMessage);
          setIsConnected(false);
          // URL에서 파라미터 제거
          navigate(location.pathname, { replace: true });
        } else {
          // 일반적인 연결 상태 확인
          const status = await checkGoogleConnectionStatus();
          setIsConnected(status.connected);
          if (status.reason === 'token_expired') {
            setError('Google 연결이 만료되었습니다. 다시 연결해주세요.');
          }
        }
      } catch (err) {
        console.error('Failed to check Google connection:', err);
        setIsConnected(false);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [location.search, location.pathname, navigate]);

  // 이벤트 새로고침
  const refresh = useCallback(async () => {
    if (!isConnected) return;

    setLoading(true);
    setError(null);
    try {
      const googleEvents = await fetchGoogleEvents();
      setEvents(googleEvents);
    } catch (err) {
      console.error('Failed to fetch Google events:', err);

      if (err.status === 401 || err.needsReconnect) {
        setIsConnected(false);
        setError('Google 연결이 만료되었습니다. 다시 연결해주세요.');
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

  // Google 계정 연결 (OAuth 페이지로 리다이렉트)
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await signInToGoogle(); // 이 함수가 페이지를 리다이렉트함
    } catch (err) {
      console.error('Google sign in failed:', err);
      setError('Google 로그인 실패');
      setLoading(false);
    }
  }, []);

  // Google 계정 연결 해제
  const disconnect = useCallback(async () => {
    setLoading(true);
    try {
      await signOutFromGoogle();
      setIsConnected(false);
      setEvents([]);
      setError(null);
    } catch (err) {
      console.error('Google disconnect failed:', err);
      setError('연결 해제 실패');
    } finally {
      setLoading(false);
    }
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
