import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  loadGoogleScripts,
  signInToGoogle,
  signOutFromGoogle,
  restoreGoogleSession,
  fetchGoogleEvents,
  addGoogleEvent,
  deleteGoogleEvent,
  updateGoogleEvent
} from '../services/googleCalendar';

const CALENDAR_STORAGE_KEY = 'ilouli_family_calendar';

export const EVENT_COLORS = {
  DEFAULT: '#0071e3',
  FAMILY: '#34c759',
  BIRTHDAY: '#ff9500',
  TRAVEL: '#5856d6',
  HEALTH: '#ff3b30',
  WORK: '#007aff',
  OTHER: '#8e8e93',
  GOOGLE: '#4285f4'
};

export const EVENT_CATEGORIES = {
  FAMILY: 'family',
  BIRTHDAY: 'birthday',
  TRAVEL: 'travel',
  HEALTH: 'health',
  WORK: 'work',
  OTHER: 'other'
};

const CalendarContext = createContext(null);

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within CalendarProvider');
  }
  return context;
};

export const CalendarProvider = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState(null);

  // 로컬 스토리지에서 이벤트 로드
  useEffect(() => {
    const stored = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEvents(parsed);
      } catch (e) {
        console.error('Failed to parse calendar events:', e);
      }
    }
  }, []);

  // Google API 초기화 및 세션 복원
  useEffect(() => {
    const initGoogle = async () => {
      try {
        await loadGoogleScripts();
        const restored = await restoreGoogleSession();
        if (restored) {
          setGoogleConnected(true);
        }
      } catch (err) {
        console.error('Failed to init Google API:', err);
      }
    };
    initGoogle();
  }, []);

  // Google 이벤트 새로고침
  const refreshGoogleEvents = useCallback(async () => {
    if (!googleConnected) return;

    setGoogleLoading(true);
    setGoogleError(null);
    try {
      const events = await fetchGoogleEvents();
      setGoogleEvents(events);
    } catch (err) {
      console.error('Failed to fetch Google events:', err);
      setGoogleError('Google 캘린더 동기화 실패');
      // 토큰 만료 시 연결 해제
      if (err.status === 401) {
        setGoogleConnected(false);
        signOutFromGoogle();
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [googleConnected]);

  // Google 연결 상태 변경 시 이벤트 새로고침
  useEffect(() => {
    if (googleConnected) {
      refreshGoogleEvents();
    } else {
      setGoogleEvents([]);
    }
  }, [googleConnected, refreshGoogleEvents]);

  // Google 계정 연결
  const connectGoogle = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      await signInToGoogle();
      setGoogleConnected(true);
    } catch (err) {
      console.error('Google sign in failed:', err);
      setGoogleError('Google 로그인 실패');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Google 계정 연결 해제
  const disconnectGoogle = () => {
    signOutFromGoogle();
    setGoogleConnected(false);
    setGoogleEvents([]);
  };

  // 이벤트 저장 (로컬)
  const saveEvents = (newEvents) => {
    const localEvents = newEvents.filter(e => !e.isGoogleEvent);
    setEvents(localEvents);
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(localEvents));
  };

  // 모든 이벤트 (로컬 + Google)
  const allEvents = [...events, ...googleEvents];

  // 이벤트 추가
  const addEvent = async (eventData, syncToGoogle = false) => {
    const newEvent = {
      id: Date.now().toString(),
      ...eventData,
      createdBy: user?.id,
      createdByName: user?.name,
      createdAt: new Date().toISOString(),
      isGoogleEvent: false
    };

    // Google에도 동기화
    if (syncToGoogle && googleConnected) {
      try {
        const googleResult = await addGoogleEvent(eventData);
        newEvent.googleId = googleResult.id;
        newEvent.syncedToGoogle = true;
      } catch (err) {
        console.error('Failed to sync to Google:', err);
      }
    }

    const newEvents = [...events, newEvent];
    saveEvents(newEvents);
    return newEvent;
  };

  // 이벤트 수정
  const updateEvent = async (eventId, eventData) => {
    const event = allEvents.find(e => e.id === eventId);

    // Google 이벤트인 경우
    if (event?.isGoogleEvent && event.googleId) {
      try {
        await updateGoogleEvent(event.googleId, eventData);
        await refreshGoogleEvents();
      } catch (err) {
        console.error('Failed to update Google event:', err);
      }
      return;
    }

    // 로컬 이벤트 수정
    const newEvents = events.map(e =>
      e.id === eventId
        ? { ...e, ...eventData, updatedAt: new Date().toISOString() }
        : e
    );
    saveEvents(newEvents);

    // Google에 동기화된 이벤트인 경우
    if (event?.syncedToGoogle && event.googleId) {
      try {
        await updateGoogleEvent(event.googleId, eventData);
      } catch (err) {
        console.error('Failed to sync update to Google:', err);
      }
    }
  };

  // 이벤트 삭제
  const deleteEvent = async (eventId) => {
    const event = allEvents.find(e => e.id === eventId);

    // Google 이벤트인 경우
    if (event?.isGoogleEvent && event.googleId) {
      try {
        await deleteGoogleEvent(event.googleId);
        await refreshGoogleEvents();
      } catch (err) {
        console.error('Failed to delete Google event:', err);
      }
      return;
    }

    // 로컬 이벤트 삭제
    const newEvents = events.filter(e => e.id !== eventId);
    saveEvents(newEvents);

    // Google에 동기화된 이벤트인 경우
    if (event?.syncedToGoogle && event.googleId) {
      try {
        await deleteGoogleEvent(event.googleId);
      } catch (err) {
        console.error('Failed to delete from Google:', err);
      }
    }
  };

  // 날짜를 로컬 YYYY-MM-DD 형식으로 변환 (타임존 문제 방지)
  const toLocalDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 이벤트 날짜 문자열을 로컬 Date로 파싱 (타임존 문제 방지)
  const parseEventDate = (dateStr) => {
    // "YYYY-MM-DD" 형식의 문자열을 로컬 시간으로 파싱
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date) => {
    const dateStr = toLocalDateString(date);
    return allEvents.filter(event => event.date === dateStr);
  };

  // 특정 월의 이벤트 가져오기
  const getEventsForMonth = (year, month) => {
    return allEvents.filter(event => {
      const eventDate = parseEventDate(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  };

  // 다가오는 이벤트 가져오기 (오늘부터 n일 이내)
  const getUpcomingEvents = (days = 7) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    return allEvents
      .filter(event => {
        const eventDate = parseEventDate(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today && eventDate <= endDate;
      })
      .sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));
  };

  // 이전 달로 이동
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  // 다음 달로 이동
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // 오늘로 이동
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // 카테고리 색상 가져오기
  const getCategoryColor = (category, isGoogleEvent = false) => {
    if (isGoogleEvent) return EVENT_COLORS.GOOGLE;
    switch (category) {
      case EVENT_CATEGORIES.FAMILY: return EVENT_COLORS.FAMILY;
      case EVENT_CATEGORIES.BIRTHDAY: return EVENT_COLORS.BIRTHDAY;
      case EVENT_CATEGORIES.TRAVEL: return EVENT_COLORS.TRAVEL;
      case EVENT_CATEGORIES.HEALTH: return EVENT_COLORS.HEALTH;
      case EVENT_CATEGORIES.WORK: return EVENT_COLORS.WORK;
      case EVENT_CATEGORIES.OTHER: return EVENT_COLORS.OTHER;
      default: return EVENT_COLORS.DEFAULT;
    }
  };

  const value = {
    events: allEvents,
    localEvents: events,
    googleEvents,
    selectedDate,
    setSelectedDate,
    currentMonth,
    setCurrentMonth,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForMonth,
    getUpcomingEvents,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    getCategoryColor,
    EVENT_CATEGORIES,
    EVENT_COLORS,
    // Google 관련
    googleConnected,
    googleLoading,
    googleError,
    connectGoogle,
    disconnectGoogle,
    refreshGoogleEvents
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
