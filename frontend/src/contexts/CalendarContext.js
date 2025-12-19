import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CALENDAR_STORAGE_KEY = 'ilouli_family_calendar';

export const EVENT_COLORS = {
  DEFAULT: '#0071e3',
  FAMILY: '#34c759',
  BIRTHDAY: '#ff9500',
  TRAVEL: '#5856d6',
  HEALTH: '#ff3b30',
  WORK: '#007aff',
  OTHER: '#8e8e93'
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

  // 이벤트 저장
  const saveEvents = (newEvents) => {
    setEvents(newEvents);
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(newEvents));
  };

  // 이벤트 추가
  const addEvent = (eventData) => {
    const newEvent = {
      id: Date.now().toString(),
      ...eventData,
      createdBy: user?.id,
      createdByName: user?.name,
      createdAt: new Date().toISOString()
    };
    const newEvents = [...events, newEvent];
    saveEvents(newEvents);
    return newEvent;
  };

  // 이벤트 수정
  const updateEvent = (eventId, eventData) => {
    const newEvents = events.map(event =>
      event.id === eventId
        ? { ...event, ...eventData, updatedAt: new Date().toISOString() }
        : event
    );
    saveEvents(newEvents);
  };

  // 이벤트 삭제
  const deleteEvent = (eventId) => {
    const newEvents = events.filter(event => event.id !== eventId);
    saveEvents(newEvents);
  };

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // 특정 월의 이벤트 가져오기
  const getEventsForMonth = (year, month) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  };

  // 다가오는 이벤트 가져오기 (오늘부터 n일 이내)
  const getUpcomingEvents = (days = 7) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today && eventDate <= endDate;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
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
  const getCategoryColor = (category) => {
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
    events,
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
    EVENT_COLORS
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
};
