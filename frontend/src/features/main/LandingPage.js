import React from 'react';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';

const LandingPage = () => {
  const { t } = useTranslation();

  return (
    <div className="landing-container">
      <header className="hero-section">
        <h1>ilouli.com</h1>
        <p className="subtitle">{t('landing.subtitle')}</p>
      </header>

      <main className="features-grid">
        <section className="feature-card">
          <h2>{t('landing.aiStoryboard.title')}</h2>
          <p>{t('landing.aiStoryboard.description')}</p>
        </section>

        <section className="feature-card">
          <h2>{t('landing.familySpace.title')}</h2>
          <p>{t('landing.familySpace.description')}</p>
        </section>

        <section className="feature-card">
          <h2>{t('landing.brandUniverse.title')}</h2>
          <p>{t('landing.brandUniverse.description')}</p>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
