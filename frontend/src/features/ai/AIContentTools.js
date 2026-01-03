import React from 'react';
import { useTranslation } from 'react-i18next';
import './AIContentTools.css';

const AIContentTools = () => {
  const { t } = useTranslation();

  return (
    <div className="ai-content-tools">
      <header className="page-header">
        <h1>{t('aiContentTools.title')}</h1>
        <p>{t('aiContentTools.subtitle')}</p>
      </header>

      <div className="tools-grid">
        <div className="tool-card">
          <div className="tool-icon">📝</div>
          <h3>{t('aiContentTools.summarize.title')}</h3>
          <p>{t('aiContentTools.summarize.description')}</p>
          <span className="tool-status coming-soon">{t('aiContentTools.comingSoon')}</span>
        </div>

        <div className="tool-card">
          <div className="tool-icon">🔄</div>
          <h3>{t('aiContentTools.transform.title')}</h3>
          <p>{t('aiContentTools.transform.description')}</p>
          <span className="tool-status coming-soon">{t('aiContentTools.comingSoon')}</span>
        </div>

        <div className="tool-card">
          <div className="tool-icon">📰</div>
          <h3>{t('aiContentTools.blogDraft.title')}</h3>
          <p>{t('aiContentTools.blogDraft.description')}</p>
          <span className="tool-status coming-soon">{t('aiContentTools.comingSoon')}</span>
        </div>

        <div className="tool-card">
          <div className="tool-icon">📊</div>
          <h3>{t('aiContentTools.dailyReport.title')}</h3>
          <p>{t('aiContentTools.dailyReport.description')}</p>
          <span className="tool-status coming-soon">{t('aiContentTools.comingSoon')}</span>
        </div>
      </div>
    </div>
  );
};

export default AIContentTools;
