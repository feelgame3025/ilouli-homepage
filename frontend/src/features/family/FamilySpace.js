import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FamilyCalendar from './FamilyCalendar';
import './FamilySpace.css';

const FamilySpace = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('calendar');

  return (
    <div className="family-space-container">
      <header className="family-space-header">
        <h1>{t('family.title')}</h1>
        <p>{t('family.subtitle')}</p>
      </header>

      {/* 탭 네비게이션 */}
      <div className="family-tabs">
        <button
          className={`family-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <span className="tab-icon">📅</span>
          {t('family.calendar.title')}
        </button>
        <button
          className={`family-tab ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          <span className="tab-icon">🖼️</span>
          {t('family.gallery.title')}
        </button>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="family-content">
        {activeTab === 'calendar' && <FamilyCalendar />}

        {activeTab === 'gallery' && (
          <div className="gallery-placeholder">
            <div className="placeholder-icon">🖼️</div>
            <h2>{t('family.gallery.title')}</h2>
            <p>{t('family.gallery.description')}</p>
            <span className="coming-soon-badge">Coming Soon</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilySpace;
