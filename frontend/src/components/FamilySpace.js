import React from 'react';
import { useTranslation } from 'react-i18next';
import './FamilySpace.css';

const FamilySpace = () => {
  const { t } = useTranslation();

  return (
    <div className="family-space-container">
      <header className="family-space-header">
        <h1>{t('family.title')}</h1>
        <p>{t('family.subtitle')}</p>
      </header>

      <div className="widgets-grid">
        <div className="widget-card">
          <h2>{t('family.calendar.title')}</h2>
          <div className="widget-placeholder">
            <p>{t('family.calendar.description')}</p>
          </div>
          <button>{t('family.calendar.button')}</button>
        </div>

        <div className="widget-card">
          <h2>{t('family.gallery.title')}</h2>
          <div className="widget-placeholder">
            <p>{t('family.gallery.description')}</p>
          </div>
          <button>{t('family.gallery.button')}</button>
        </div>
      </div>
    </div>
  );
};

export default FamilySpace;
