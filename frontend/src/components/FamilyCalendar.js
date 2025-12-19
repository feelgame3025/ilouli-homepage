import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCalendar, EVENT_CATEGORIES } from '../contexts/CalendarContext';
import './FamilyCalendar.css';

const FamilyCalendar = () => {
  const { t } = useTranslation();
  const {
    currentMonth,
    selectedDate,
    setSelectedDate,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    getEventsForDate,
    getEventsForMonth,
    getUpcomingEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    getCategoryColor,
    EVENT_CATEGORIES: categories
  } = useCalendar();

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    date: '',
    time: '',
    category: EVENT_CATEGORIES.FAMILY,
    description: '',
    allDay: true
  });

  // 월의 날짜 배열 생성
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days = [];

    // 이전 달의 날짜들
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // 현재 달의 날짜들
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // 다음 달의 날짜들 (6주 채우기)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    const dateStr = selectedDate
      ? selectedDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    setEventForm({
      title: '',
      date: dateStr,
      time: '',
      category: EVENT_CATEGORIES.FAMILY,
      description: '',
      allDay: true
    });
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    setEventForm({
      title: event.title,
      date: event.date,
      time: event.time || '',
      category: event.category,
      description: event.description || '',
      allDay: event.allDay
    });
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleDeleteEvent = (eventId) => {
    if (window.confirm(t('calendar.confirmDelete'))) {
      deleteEvent(eventId);
    }
  };

  const handleSubmitEvent = (e) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.date) return;

    if (editingEvent) {
      updateEvent(editingEvent.id, eventForm);
    } else {
      addEvent(eventForm);
    }
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      [EVENT_CATEGORIES.FAMILY]: t('calendar.categories.family'),
      [EVENT_CATEGORIES.BIRTHDAY]: t('calendar.categories.birthday'),
      [EVENT_CATEGORIES.TRAVEL]: t('calendar.categories.travel'),
      [EVENT_CATEGORIES.HEALTH]: t('calendar.categories.health'),
      [EVENT_CATEGORIES.WORK]: t('calendar.categories.work'),
      [EVENT_CATEGORIES.OTHER]: t('calendar.categories.other')
    };
    return labels[category] || category;
  };

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const days = getDaysInMonth();
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const upcomingEvents = getUpcomingEvents(7);
  const monthEvents = getEventsForMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  return (
    <div className="family-calendar">
      <div className="calendar-layout">
        {/* 캘린더 메인 */}
        <div className="calendar-main">
          {/* 헤더 */}
          <div className="calendar-header">
            <div className="calendar-nav">
              <button onClick={goToPreviousMonth} className="nav-btn">
                ‹
              </button>
              <h2 className="current-month">{formatMonthYear(currentMonth)}</h2>
              <button onClick={goToNextMonth} className="nav-btn">
                ›
              </button>
            </div>
            <div className="calendar-actions">
              <button onClick={goToToday} className="today-btn">
                {t('calendar.today')}
              </button>
              <button onClick={handleAddEvent} className="add-event-btn">
                + {t('calendar.addEvent')}
              </button>
            </div>
          </div>

          {/* 요일 헤더 */}
          <div className="calendar-weekdays">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`weekday ${index === 0 ? 'sunday' : ''} ${index === 6 ? 'saturday' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="calendar-grid">
            {days.map((day, index) => {
              const dayEvents = getEventsForDate(day.date);
              return (
                <div
                  key={index}
                  className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''}
                    ${isToday(day.date) ? 'today' : ''}
                    ${isSelected(day.date) ? 'selected' : ''}
                    ${day.date.getDay() === 0 ? 'sunday' : ''}
                    ${day.date.getDay() === 6 ? 'saturday' : ''}`}
                  onClick={() => handleDateClick(day.date)}
                >
                  <span className="day-number">{day.date.getDate()}</span>
                  {dayEvents.length > 0 && (
                    <div className="day-events">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="event-dot"
                          style={{ backgroundColor: getCategoryColor(event.category) }}
                          title={event.title}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="more-events">+{dayEvents.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 사이드바 */}
        <div className="calendar-sidebar">
          {/* 선택된 날짜의 일정 */}
          <div className="sidebar-section">
            <h3>
              {selectedDate
                ? selectedDate.toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  })
                : t('calendar.selectDate')}
            </h3>
            {selectedDateEvents.length === 0 ? (
              <p className="no-events">{t('calendar.noEvents')}</p>
            ) : (
              <div className="event-list">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="event-item">
                    <div
                      className="event-color"
                      style={{ backgroundColor: getCategoryColor(event.category) }}
                    />
                    <div className="event-info">
                      <span className="event-title">{event.title}</span>
                      {!event.allDay && event.time && (
                        <span className="event-time">{event.time}</span>
                      )}
                      <span className="event-category">
                        {getCategoryLabel(event.category)}
                      </span>
                    </div>
                    <div className="event-actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditEvent(event)}
                      >
                        ✎
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 다가오는 일정 */}
          <div className="sidebar-section">
            <h3>{t('calendar.upcoming')}</h3>
            {upcomingEvents.length === 0 ? (
              <p className="no-events">{t('calendar.noUpcoming')}</p>
            ) : (
              <div className="upcoming-list">
                {upcomingEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="upcoming-item">
                    <div
                      className="event-color"
                      style={{ backgroundColor: getCategoryColor(event.category) }}
                    />
                    <div className="upcoming-info">
                      <span className="upcoming-title">{event.title}</span>
                      <span className="upcoming-date">
                        {new Date(event.date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 이벤트 추가/수정 모달 */}
      {showEventModal && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEvent ? t('calendar.editEvent') : t('calendar.addEvent')}</h2>
            <form onSubmit={handleSubmitEvent}>
              <div className="form-group">
                <label>{t('calendar.form.title')}</label>
                <input
                  type="text"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder={t('calendar.form.titlePlaceholder')}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('calendar.form.date')}</label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={eventForm.allDay}
                    onChange={(e) => setEventForm({ ...eventForm, allDay: e.target.checked })}
                  />
                  {t('calendar.form.allDay')}
                </label>
              </div>

              {!eventForm.allDay && (
                <div className="form-group">
                  <label>{t('calendar.form.time')}</label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                  />
                </div>
              )}

              <div className="form-group">
                <label>{t('calendar.form.category')}</label>
                <select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                >
                  {Object.values(categories).map((cat) => (
                    <option key={cat} value={cat}>
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t('calendar.form.description')}</label>
                <textarea
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder={t('calendar.form.descriptionPlaceholder')}
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowEventModal(false)}
                >
                  {t('calendar.form.cancel')}
                </button>
                <button type="submit" className="submit-btn">
                  {editingEvent ? t('calendar.form.update') : t('calendar.form.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyCalendar;
