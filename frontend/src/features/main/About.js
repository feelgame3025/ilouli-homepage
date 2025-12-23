import React from 'react';
import { useTranslation } from 'react-i18next';
import './About.css';

const About = () => {
  const { t } = useTranslation();

  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <h1>{t('about.hero.title')}</h1>
        <p className="hero-subtitle">{t('about.hero.subtitle')}</p>
      </section>

      {/* Vision Section */}
      <section className="about-section">
        <div className="section-content">
          <h2>{t('about.vision.title')}</h2>
          <p>{t('about.vision.description')}</p>
        </div>
      </section>

      {/* Values Section */}
      <section className="about-section values-section">
        <h2>{t('about.values.title')}</h2>
        <div className="values-grid">
          <div className="value-card">
            <div className="value-icon">💡</div>
            <h3>{t('about.values.innovation.title')}</h3>
            <p>{t('about.values.innovation.description')}</p>
          </div>
          <div className="value-card">
            <div className="value-icon">🤝</div>
            <h3>{t('about.values.connection.title')}</h3>
            <p>{t('about.values.connection.description')}</p>
          </div>
          <div className="value-card">
            <div className="value-icon">🌱</div>
            <h3>{t('about.values.legacy.title')}</h3>
            <p>{t('about.values.legacy.description')}</p>
          </div>
        </div>
      </section>

      {/* Ventures Section */}
      <section className="about-section ventures-section">
        <h2>{t('about.ventures.title')}</h2>
        <p className="ventures-intro">{t('about.ventures.description')}</p>
        <div className="ventures-grid">
          <div className="venture-card">
            <div className="venture-badge">{t('about.ventures.flagship')}</div>
            <h3>AI Storyboard</h3>
            <p>{t('about.ventures.aiStoryboard')}</p>
          </div>
          <div className="venture-card coming-soon">
            <div className="venture-badge">{t('about.ventures.comingSoon')}</div>
            <h3>Creative Studio</h3>
            <p>{t('about.ventures.creativeStudio')}</p>
          </div>
          <div className="venture-card coming-soon">
            <div className="venture-badge">{t('about.ventures.comingSoon')}</div>
            <h3>Digital Archive</h3>
            <p>{t('about.ventures.digitalArchive')}</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="about-section contact-section">
        <h2>{t('about.contact.title')}</h2>
        <p>{t('about.contact.description')}</p>
        <div className="contact-info">
          <div className="contact-item">
            <span className="contact-label">{t('about.contact.email')}</span>
            <span className="contact-value">contact@ilouli.com</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
