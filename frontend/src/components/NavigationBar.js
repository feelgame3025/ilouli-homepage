import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, USER_TIERS } from '../contexts/AuthContext';
import { useNotification, NOTIFICATION_TYPES } from '../contexts/NotificationContext';
import { getCurrentHost, getHostUrl, HOSTS } from '../utils/hostConfig';
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
  const currentHost = getCurrentHost();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    logout();
    window.location.href = getHostUrl(HOSTS.MAIN, '/');
  };

  const handleMenuItemClick = () => {
    setIsUserMenuOpen(false);
  };

  const showFamilySpace = hasAccess([USER_TIERS.FAMILY, USER_TIERS.ADMIN]);
  const showAIFeatures = hasAccess([USER_TIERS.SUBSCRIBER, USER_TIERS.FAMILY, USER_TIERS.ADMIN]);
  const isActualAdmin = getActualTier && getActualTier() === USER_TIERS.ADMIN;
  const showAdminLab = hasAccess([USER_TIERS.ADMIN, USER_TIERS.FAMILY]);

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
    setActiveDropdown(null);
    document.body.style.overflow = '';
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    const newState = !isMobileMenuOpen;
    setIsMobileMenuOpen(newState);
    if (!newState) {
      setActiveDropdown(null);
    }
    document.body.style.overflow = newState ? 'hidden' : '';
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    document.body.style.overflow = '';
  };

  const handleDropdownEnter = (name) => {
    setActiveDropdown(name);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  const toggleMobileDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
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

  // 현재 호스트에 맞는 활성 상태 확인
  const isActiveHost = (host) => currentHost === host;

  return (
    <>
      <header className={`app-header ${isScrolled ? 'scrolled' : ''} ${activeDropdown ? 'dropdown-open' : ''}`}>
        <div className="nav-container">
          <a href={getHostUrl(HOSTS.MAIN, '/')} className="logo">ilouli</a>

          {/* 모바일 오버레이 */}
          {isMobileMenuOpen && (
            <div className="mobile-overlay" onClick={closeMobileMenu}></div>
          )}

          <nav
            className={`main-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}
            ref={navRef}
            onMouseLeave={handleDropdownLeave}
          >
            <ul className="nav-menu">
              {/* About */}
              <li className="nav-item">
                <a
                  href={getHostUrl(HOSTS.MAIN, '/about')}
                  className={`nav-link ${currentHost === HOSTS.MAIN && location.pathname === '/about' ? 'active' : ''}`}
                >
                  {t('nav.about')}
                </a>
              </li>

              {/* Community Dropdown */}
              <li
                className={`nav-item has-flyout ${activeDropdown === 'community' ? 'flyout-open' : ''}`}
                onMouseEnter={() => handleDropdownEnter('community')}
              >
                <button
                  className={`nav-link ${isActiveHost(HOSTS.COMMUNITY) ? 'active' : ''}`}
                  onClick={() => toggleMobileDropdown('community')}
                >
                  {t('nav.community')}
                </button>
                {/* Mobile Submenu */}
                <div className="mobile-submenu">
                  <a href={getHostUrl(HOSTS.COMMUNITY, '/announcements')} className="mobile-submenu-link">
                    {t('nav.announcements')}
                  </a>
                  <a href={getHostUrl(HOSTS.COMMUNITY, '/free-board')} className="mobile-submenu-link">
                    {t('nav.freeBoard')}
                  </a>
                </div>
              </li>

              {/* AI Features - 구독자 이상 */}
              {showAIFeatures && (
                <li
                  className={`nav-item has-flyout ${activeDropdown === 'ai' ? 'flyout-open' : ''}`}
                  onMouseEnter={() => handleDropdownEnter('ai')}
                >
                  <button
                    className={`nav-link ${isActiveHost(HOSTS.AI) ? 'active' : ''}`}
                    onClick={() => toggleMobileDropdown('ai')}
                  >
                    {t('nav.aiFeatures')}
                  </button>
                  {/* Mobile Submenu */}
                  <div className="mobile-submenu">
                    <a href={getHostUrl(HOSTS.AI, '/storyboard')} className="mobile-submenu-link">
                      {t('nav.aiStoryboard')}
                    </a>
                    <a href={getHostUrl(HOSTS.AI, '/content-tools')} className="mobile-submenu-link">
                      {t('nav.aiContentTools')}
                    </a>
                  </div>
                </li>
              )}

              {/* Family Space - Family/Admin */}
              {showFamilySpace && (
                <li className="nav-item">
                  <a
                    href={getHostUrl(HOSTS.FAMILY, '/')}
                    className={`nav-link ${isActiveHost(HOSTS.FAMILY) ? 'active' : ''}`}
                  >
                    {t('nav.familySpace')}
                  </a>
                </li>
              )}

              {/* Admin Lab - Family/Admin */}
              {showAdminLab && (
                <li
                  className={`nav-item has-flyout ${activeDropdown === 'lab' ? 'flyout-open' : ''}`}
                  onMouseEnter={() => handleDropdownEnter('lab')}
                >
                  <button
                    className={`nav-link ${isActiveHost(HOSTS.LAB) ? 'active' : ''}`}
                    onClick={() => toggleMobileDropdown('lab')}
                  >
                    {t('nav.adminLab')}
                  </button>
                  {/* Mobile Submenu */}
                  <div className="mobile-submenu">
                    <a href={getHostUrl(HOSTS.LAB, '/test-zone')} className="mobile-submenu-link">
                      {t('nav.testZone')}
                    </a>
                    <a href={getHostUrl(HOSTS.LAB, '/file-upload')} className="mobile-submenu-link">
                      {t('nav.fileUpload')}
                    </a>
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
              <div className={`user-menu-dropdown ${isUserMenuOpen ? 'open' : ''}`} ref={userMenuRef}>
                <button
                  className="user-menu-trigger"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <span className="user-avatar-small">{user.name?.charAt(0).toUpperCase()}</span>
                  <span className="user-name">{user.name}</span>
                  {viewAsTier && <span className="viewing-as-indicator">👁</span>}
                  <svg className={`dropdown-arrow ${isUserMenuOpen ? 'open' : ''}`} width="10" height="6" viewBox="0 0 10 6">
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
                    <Link to="/profile" className="user-dropdown-item" onClick={handleMenuItemClick}>
                      <span className="dropdown-icon">👤</span>
                      <span>내 프로필</span>
                    </Link>

                    {/* 관리자 전용 메뉴 */}
                    {isActualAdmin && (
                      <>
                        <a href={getHostUrl(HOSTS.ADMIN, '/')} className="user-dropdown-item" onClick={handleMenuItemClick}>
                          <span className="dropdown-icon">⚙️</span>
                          <span>관리자 대시보드</span>
                        </a>

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
              <a href={getHostUrl(HOSTS.MAIN, '/login')} className="login-btn">
                {t('auth.login.button')}
              </a>
            )}

            {/* 모바일 햄버거 버튼 */}
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

        {/* Apple Style Flyout Panels */}
        <div className={`flyout-container ${activeDropdown ? 'visible' : ''}`} onMouseLeave={handleDropdownLeave}>
          {/* Community Flyout */}
          <div className={`flyout-panel ${activeDropdown === 'community' ? 'active' : ''}`} onMouseEnter={() => handleDropdownEnter('community')}>
            <div className="flyout-content">
              <div className="flyout-section">
                <h3 className="flyout-section-title">커뮤니티</h3>
                <div className="flyout-links">
                  <a href={getHostUrl(HOSTS.COMMUNITY, '/announcements')} className="flyout-link">
                    <span className="flyout-link-icon">📢</span>
                    <div className="flyout-link-text">
                      <span className="flyout-link-title">{t('nav.announcements')}</span>
                      <span className="flyout-link-desc">중요한 소식과 업데이트</span>
                    </div>
                  </a>
                  <a href={getHostUrl(HOSTS.COMMUNITY, '/free-board')} className="flyout-link">
                    <span className="flyout-link-icon">💬</span>
                    <div className="flyout-link-text">
                      <span className="flyout-link-title">{t('nav.freeBoard')}</span>
                      <span className="flyout-link-desc">자유롭게 소통하기</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* AI Features Flyout */}
          {showAIFeatures && (
            <div className={`flyout-panel ${activeDropdown === 'ai' ? 'active' : ''}`} onMouseEnter={() => handleDropdownEnter('ai')}>
              <div className="flyout-content">
                <div className="flyout-section">
                  <h3 className="flyout-section-title">AI 기능</h3>
                  <div className="flyout-links">
                    <a href={getHostUrl(HOSTS.AI, '/storyboard')} className="flyout-link">
                      <span className="flyout-link-icon">🎬</span>
                      <div className="flyout-link-text">
                        <span className="flyout-link-title">{t('nav.aiStoryboard')}</span>
                        <span className="flyout-link-desc">AI 기반 스토리 생성</span>
                      </div>
                    </a>
                    <a href={getHostUrl(HOSTS.AI, '/content-tools')} className="flyout-link">
                      <span className="flyout-link-icon">✨</span>
                      <div className="flyout-link-text">
                        <span className="flyout-link-title">{t('nav.aiContentTools')}</span>
                        <span className="flyout-link-desc">콘텐츠 요약 및 변환</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Lab Flyout */}
          {showAdminLab && (
            <div className={`flyout-panel ${activeDropdown === 'lab' ? 'active' : ''}`} onMouseEnter={() => handleDropdownEnter('lab')}>
              <div className="flyout-content">
                <div className="flyout-section">
                  <h3 className="flyout-section-title">관리자 랩</h3>
                  <div className="flyout-links">
                    <a href={getHostUrl(HOSTS.LAB, '/test-zone')} className="flyout-link">
                      <span className="flyout-link-icon">🧪</span>
                      <div className="flyout-link-text">
                        <span className="flyout-link-title">{t('nav.testZone')}</span>
                        <span className="flyout-link-desc">새로운 기능 테스트</span>
                      </div>
                    </a>
                    <a href={getHostUrl(HOSTS.LAB, '/file-upload')} className="flyout-link">
                      <span className="flyout-link-icon">📁</span>
                      <div className="flyout-link-text">
                        <span className="flyout-link-title">{t('nav.fileUpload')}</span>
                        <span className="flyout-link-desc">AI 파일 분석</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Flyout 배경 오버레이 */}
      <div className={`flyout-backdrop ${activeDropdown ? 'visible' : ''}`} onClick={handleDropdownLeave}></div>
    </>
  );
};

export default NavigationBar;
