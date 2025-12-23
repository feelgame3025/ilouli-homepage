import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './AIContentTools.css';

const AIContentTools = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="ai-content-tools">
      <header className="page-header">
        <h1>{t('aiContentTools.title')}</h1>
        <p>{t('aiContentTools.subtitle')}</p>
      </header>

      <div className="tools-grid">
        {/* AI 영상 제작 - 사용 가능 */}
        <div
          className="tool-card available"
          onClick={() => navigate('/video-creator')}
          style={{ cursor: 'pointer' }}
        >
          <div className="tool-icon">🎬</div>
          <h3>AI 영상 제작</h3>
          <p>AI가 전문적인 숏폼 영상을 자동으로 제작합니다.</p>
          <span className="tool-status available">사용 가능</span>
        </div>

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
