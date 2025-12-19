import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, USER_TIERS } from '../contexts/AuthContext';
import { useNotification, NOTIFICATION_TYPES } from '../contexts/NotificationContext';
import LanguageSelector from './LanguageSelector';
import './NavigationBar.css';

const NavigationBar = () => {
  const { t } = useTranslation();
  const {
    user,
    isAuthenticated,
    logout,
    hasAccess,
    setViewAs,
    resetViewAs,
    viewAsTier,
    getActualTier
  } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedDropdown, setExpandedDropdown] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 알림 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const showFamilySpace = hasAccess([USER_TIERS.FAMILY, USER_TIERS.ADMIN]);
  const isActualAdmin = getActualTier && getActualTier() === USER_TIERS.ADMIN;
  const showAdminLab = hasAccess([USER_TIERS.ADMIN, USER_TIERS.FAMILY]);

  const isAdminLabActive = location.pathname.startsWith('/admin-lab');
  const isCommunityActive = location.pathname.startsWith('/community');

  const tierLabels = {
    [USER_TIERS.GUEST]: '방문객',
    [USER_TIERS.GENERAL]: '일반 회원',
    [USER_TIERS.SUBSCRIBER]: '구독자',
    [USER_TIERS.FAMILY]: '가족 구성원',
    [USER_TIERS.ADMIN]: '관리자'
  };

  const handleViewAsTier = (tier) => {
    if (tier === null) {
      resetViewAs();
    } else {
      setViewAs(tier);
    }
  };

  // 모바일 메뉴 닫기 (페이지 이동 시)
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setExpandedDropdown(null);
    document.body.style.overflow = '';
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    if (!newState) {
      setExpandedDropdown(null);
    }
    // 모바일 메뉴 열릴 때 body 스크롤 방지
    document.body.style.overflow = newState ? 'hidden' : '';
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setExpandedDropdown(null);
    document.body.style.overflow = '';
  };

  const toggleDropdown = (name) => {
    setExpandedDropdown(expandedDropdown === name ? null : name);
  };

  const toggleNotification = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.COMMENT: return '💬';
      case NOTIFICATION_TYPES.REPLY: return '↩️';
      case NOTIFICATION_TYPES.REPORT_RESULT: return '📋';
      case NOTIFICATION_TYPES.APPROVAL: return '✅';
      case NOTIFICATION_TYPES.MENTION: return '@';
      case NOTIFICATION_TYPES.SYSTEM: return '🔔';
      default: return '🔔';
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return t('notification.time.justNow');
    if (diff < 3600) return t('notification.time.minutesAgo', { count: Math.floor(diff / 60) });
    if (diff < 86400) return t('notification.time.hoursAgo', { count: Math.floor(diff / 3600) });
    if (diff < 604800) return t('notification.time.daysAgo', { count: Math.floor(diff / 86400) });
    return date.toLocaleDateString('ko-KR');
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
      setIsNotificationOpen(false);
    }
  };

  return (
    <header className={`app-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="logo">ilouli.com</Link>

        {/* 모바일 오버레이 */}
        {isMobileMenuOpen && (
          <div className="mobile-overlay" onClick={closeMobileMenu}></div>
        )}

        <nav className={`main-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <ul>
            {showFamilySpace && (
              <li>
                <NavLink to="/storyboard" className={({ isActive }) => isActive ? 'active' : ''}>
                  {t('nav.aiStoryboard')}
                </NavLink>
              </li>
            )}
            <li className={`has-dropdown ${expandedDropdown === 'community' ? 'mobile-expanded' : ''}`}>
              <span
                className={`dropdown-trigger ${isCommunityActive ? 'active' : ''}`}
                onClick={() => toggleDropdown('community')}
              >
                {t('nav.community')}
                <svg className="dropdown-arrow" width="10" height="6" viewBox="0 0 10 6">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </span>
              <div className="dropdown-menu">
                <div className="dropdown-content">
                  <NavLink
                    to="/community/announcements"
                    className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                  >
                    <span className="dropdown-icon">📢</span>
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-title">{t('nav.announcements')}</span>
                      <span className="dropdown-item-desc">중요한 소식 확인</span>
                    </div>
                  </NavLink>
                  <NavLink
                    to="/community/free-board"
                    className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                  >
                    <span className="dropdown-icon">💬</span>
                    <div className="dropdown-item-content">
                      <span className="dropdown-item-title">{t('nav.freeBoard')}</span>
                      <span className="dropdown-item-desc">자유롭게 소통하기</span>
                    </div>
                  </NavLink>
                </div>
              </div>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => isActive ? 'active' : ''}>
                {t('nav.about')}
              </NavLink>
            </li>
            {showFamilySpace && (
              <li>
                <NavLink to="/family" className={({ isActive }) => isActive ? 'active' : ''}>
                  {t('nav.familySpace')}
                </NavLink>
              </li>
            )}
            {showAdminLab && (
              <li className={`has-dropdown ${expandedDropdown === 'adminlab' ? 'mobile-expanded' : ''}`}>
                <span
                  className={`dropdown-trigger ${isAdminLabActive ? 'active' : ''}`}
                  onClick={() => toggleDropdown('adminlab')}
                >
                  {t('nav.adminLab')}
                  <svg className="dropdown-arrow" width="10" height="6" viewBox="0 0 10 6">
                    <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                </span>
                <div className="dropdown-menu">
                  <div className="dropdown-content">
                    <NavLink
                      to="/admin-lab/test-zone"
                      className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                    >
                      <span className="dropdown-icon">🧪</span>
                      <div className="dropdown-item-content">
                        <span className="dropdown-item-title">{t('nav.testZone')}</span>
                        <span className="dropdown-item-desc">새로운 기능 테스트</span>
                      </div>
                    </NavLink>
                    <NavLink
                      to="/admin-lab/file-upload"
                      className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                    >
                      <span className="dropdown-icon">📁</span>
                      <div className="dropdown-item-content">
                        <span className="dropdown-item-title">{t('nav.fileUpload')}</span>
                        <span className="dropdown-item-desc">AI 파일 분석</span>
                      </div>
                    </NavLink>
                  </div>
                </div>
              </li>
            )}
          </ul>
        </nav>

        <div className="nav-actions">
          <LanguageSelector />

          {/* 알림 아이콘 */}
          {isAuthenticated && (
            <div className="notification-dropdown" ref={notificationRef}>
              <button
                className={`notification-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                onClick={toggleNotification}
                aria-label={t('notification.title')}
              >
                <svg className="notification-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="notification-panel">
                  <div className="notification-header">
                    <h3>{t('notification.title')}</h3>
                    {unreadCount > 0 && (
                      <button className="mark-all-read" onClick={markAllAsRead}>
                        {t('notification.markAllRead')}
                      </button>
                    )}
                  </div>

                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <span className="empty-icon">🔔</span>
                        <p>{t('notification.empty')}</p>
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <span className="notification-type-icon">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="notification-content">
                            <p className="notification-title">{notification.title}</p>
                            <p className="notification-message">{notification.message}</p>
                            <span className="notification-time">{formatTimeAgo(notification.createdAt)}</span>
                          </div>
                          <button
                            className="notification-delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="notification-footer">
                      <Link to="/profile" onClick={() => setIsNotificationOpen(false)}>
                        {t('notification.settings')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isAuthenticated ? (
            <div className="user-menu-dropdown">
              <button className="user-menu-trigger">
                <span className="user-avatar-small">{user.name?.charAt(0).toUpperCase()}</span>
                <span className="user-name">{user.name}</span>
                {viewAsTier && <span className="viewing-as-indicator">👁</span>}
                <svg className="dropdown-arrow" width="10" height="6" viewBox="0 0 10 6">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </button>
              <div className="user-dropdown-menu">
                <div className="user-dropdown-content">
                  {/* 내 정보 섹션 */}
                  <div className="admin-user-info">
                    <div className="user-info-header">
                      <span className="user-avatar">{user.name?.charAt(0).toUpperCase()}</span>
                      <div className="user-details">
                        <span className="user-name-display">{user.name}</span>
                        <span className="user-email-display">{user.email}</span>
                        <span className="user-tier-badge">{tierLabels[user.tier]}</span>
                      </div>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  {/* 프로필 링크 */}
                  <Link to="/profile" className="user-dropdown-item">
                    <span className="dropdown-icon">👤</span>
                    <span>내 프로필</span>
                  </Link>

                  {/* 관리자 전용 메뉴 */}
                  {isActualAdmin && (
                    <>
                      <Link to="/admin" className="user-dropdown-item">
                        <span className="dropdown-icon">⚙️</span>
                        <span>관리자 대시보드</span>
                      </Link>

                      <div className="dropdown-divider"></div>

                      {/* 등급 시뮬레이션 섹션 */}
                      <div className="tier-simulation-section">
                        <span className="tier-simulation-label">다른 등급으로 보기</span>
                        <div className="tier-buttons">
                          <button
                            className={`tier-btn ${viewAsTier === null ? 'active' : ''}`}
                            onClick={() => handleViewAsTier(null)}
                          >
                            관리자 (기본)
                          </button>
                          <button
                            className={`tier-btn ${viewAsTier === USER_TIERS.FAMILY ? 'active' : ''}`}
                            onClick={() => handleViewAsTier(USER_TIERS.FAMILY)}
                          >
                            가족 구성원
                          </button>
                          <button
                            className={`tier-btn ${viewAsTier === USER_TIERS.SUBSCRIBER ? 'active' : ''}`}
                            onClick={() => handleViewAsTier(USER_TIERS.SUBSCRIBER)}
                          >
                            구독자
                          </button>
                          <button
                            className={`tier-btn ${viewAsTier === USER_TIERS.GENERAL ? 'active' : ''}`}
                            onClick={() => handleViewAsTier(USER_TIERS.GENERAL)}
                          >
                            일반 회원
                          </button>
                          <button
                            className={`tier-btn ${viewAsTier === USER_TIERS.GUEST ? 'active' : ''}`}
                            onClick={() => handleViewAsTier(USER_TIERS.GUEST)}
                          >
                            방문객
                          </button>
                        </div>
                        {viewAsTier && (
                          <div className="viewing-as-notice">
                            현재 <strong>{tierLabels[viewAsTier]}</strong> 등급으로 보는 중
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="dropdown-divider"></div>

                  {/* 로그아웃 */}
                  <button onClick={handleLogout} className="user-dropdown-item logout">
                    <span className="dropdown-icon">🚪</span>
                    <span>{t('auth.logout')}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="login-btn">
              {t('auth.login.button')}
            </Link>
          )}

          {/* 모바일 햄버거 버튼 - 가장 오른쪽 */}
          <button
            className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="메뉴 열기"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavigationBar;
