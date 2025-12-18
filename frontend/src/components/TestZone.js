import React from 'react';
import { useTranslation } from 'react-i18next';
import AssetLibrary from './AssetLibrary';
import './TestZone.css';

const TestZone = () => {
  const { t } = useTranslation();

  return (
    <div className="test-zone-container">
      <header className="test-zone-header">
        <h1>{t('testZone.title')}</h1>
        <p>{t('testZone.subtitle')}</p>
      </header>

      <div className="test-zone-content">
        <div className="welcome-card">
          <div className="welcome-icon">🧪</div>
          <p>{t('testZone.welcome')}</p>
        </div>

        <section className="test-section">
          <h2>Asset Library</h2>
          <AssetLibrary />
        </section>

        {/* Additional test components can be added here */}
        <section className="test-section">
          <h2>컴포넌트 테스트 영역</h2>
          <div className="test-placeholder">
            <p>새로운 컴포넌트와 기능들이 이곳에서 테스트됩니다.</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TestZone;
