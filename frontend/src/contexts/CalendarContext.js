import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';

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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Google Calendar 훅 사용
  const {
    isConnected: googleConnected,
    loading: googleLoading,
    error: googleError,
    events: googleEvents,
    connect: connectGoogle,
    disconnect: disconnectGoogle,
    refresh: refreshGoogleEvents,
    addEvent: addGoogleEventDirect,
    updateEvent: updateGoogleEventDirect,
    deleteEvent: deleteGoogleEventDirect
  } = useGoogleCalendar();

  // 로컬 스토리지에서 이벤트 로드
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.CALENDAR);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setEvents(parsed);
      } catch (e) {
        console.error('Failed to parse calendar events:', e);
      }
    }
  }, []);

  // 이벤트 저장 (로컬)
  const saveEvents = (newEvents) => {
    const localEvents = newEvents.filter(e => !e.isGoogleEvent);
    setEvents(localEvents);
    localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(localEvents));
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
        const googleResult = await addGoogleEventDirect(eventData);
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
        await updateGoogleEventDirect(event.googleId, eventData);
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
        await updateGoogleEventDirect(event.googleId, eventData);
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
        await deleteGoogleEventDirect(event.googleId);
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
        await deleteGoogleEventDirect(event.googleId);
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

  // 이벤트 검색
  const searchEvents = (query) => {
    if (!query || query.trim() === '') return [];
    const searchTerm = query.toLowerCase().trim();
    return allEvents
      .filter(event =>
        event.title?.toLowerCase().includes(searchTerm) ||
        event.description?.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => parseEventDate(a.date) - parseEventDate(b.date));
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
    searchEvents,
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
