import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification, NOTIFICATION_TYPES } from '../../contexts/NotificationContext';
import './Profile.css';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const {
    settings,
    updateSettings,
    toggleNotificationType,
    clearAllNotifications,
    notifications
  } = useNotification();

  const getTierDisplayName = (tier) => {
    const tierMap = {
      guest: t('auth.tiers.guest'),
      general: t('auth.tiers.general'),
      subscriber: t('auth.tiers.subscriber'),
      family: t('auth.tiers.family'),
      admin: t('auth.tiers.admin')
    };
    return tierMap[tier] || tier;
  };

  const notificationTypeLabels = {
    [NOTIFICATION_TYPES.COMMENT]: t('notification.types.comment'),
    [NOTIFICATION_TYPES.REPLY]: t('notification.types.reply'),
    [NOTIFICATION_TYPES.REPORT_RESULT]: t('notification.types.reportResult'),
    [NOTIFICATION_TYPES.APPROVAL]: t('notification.types.approval'),
    [NOTIFICATION_TYPES.MENTION]: t('notification.types.mention'),
    [NOTIFICATION_TYPES.SYSTEM]: t('notification.types.system')
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>{t('profile.title')}</h1>
        <p>{t('profile.subtitle')}</p>
      </header>

      <div className="profile-card">
        <h2>{user.name}</h2>
        <p className="profile-detail"><strong>{t('profile.email')}:</strong> {user.email}</p>
        <p className="profile-detail"><strong>{t('profile.membership')}:</strong> <span className="tier-badge">{getTierDisplayName(user.tier)}</span></p>
        <p className="profile-detail"><strong>{t('profile.memberSince')}:</strong> {user.joinDate}</p>
      </div>

      <div className="profile-section">
        <h2>{t('profile.creations.title')}</h2>
        <div className="creations-placeholder">
          <p>{t('profile.creations.placeholder')}</p>
        </div>
      </div>

      <div className="profile-section">
        <h2>{t('notification.settingsPage.title')}</h2>
        <div className="notification-settings">
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">{t('notification.settingsPage.sound')}</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.enableSound}
                onChange={() => updateSettings({ enableSound: !settings.enableSound })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-label">{t('notification.settingsPage.email')}</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.enableEmail}
                onChange={() => updateSettings({ enableEmail: !settings.enableEmail })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-divider"></div>

          <h3 className="setting-subtitle">{t('notification.settingsPage.typeSettings')}</h3>

          {Object.values(NOTIFICATION_TYPES).map((type) => (
            <div key={type} className="setting-item">
              <div className="setting-info">
                <span className="setting-label">{notificationTypeLabels[type]}</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.types[type]}
                  onChange={() => toggleNotificationType(type)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          ))}

          {notifications.length > 0 && (
            <>
              <div className="setting-divider"></div>
              <button
                className="clear-notifications-btn"
                onClick={() => {
                  if (window.confirm('모든 알림을 삭제하시겠습니까?')) {
                    clearAllNotifications();
                  }
                }}
              >
                모든 알림 삭제 ({notifications.length}개)
              </button>
            </>
          )}
        </div>
      </div>

      <div className="profile-section">
        <h2>{t('profile.settings.title')}</h2>
        <div className="settings-placeholder">
          <p>{t('profile.settings.placeholder')}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
