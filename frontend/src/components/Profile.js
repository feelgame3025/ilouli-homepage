import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

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
        <h2>{t('profile.settings.title')}</h2>
        <div className="settings-placeholder">
          <p>{t('profile.settings.placeholder')}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
