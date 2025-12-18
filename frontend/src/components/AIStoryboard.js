import React from 'react';
import { useTranslation } from 'react-i18next';
import './AIStoryboard.css';

const AIStoryboard = () => {
  const { t } = useTranslation();

  return (
    <div className="storyboard-container">
      <header className="storyboard-header">
        <h1>{t('storyboard.title')}</h1>
        <p>{t('storyboard.subtitle')}</p>
      </header>

      <div className="pipeline">
        {/* Step 1: Core Settings */}
        <section className="pipeline-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h2>{t('storyboard.step1.title')}</h2>
            <p>{t('storyboard.step1.description')}</p>
            <button disabled>{t('storyboard.step1.button')}</button>
          </div>
        </section>

        {/* Step 2: Scene Input */}
        <section className="pipeline-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h2>{t('storyboard.step2.title')}</h2>
            <p>{t('storyboard.step2.description')}</p>
            <textarea placeholder={t('storyboard.step2.placeholder')} rows="4"></textarea>
          </div>
        </section>

        {/* Step 3: AI Generation */}
        <section className="pipeline-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h2>{t('storyboard.step3.title')}</h2>
            <p>{t('storyboard.step3.description')}</p>
            <div className="placeholder-box">
              <p>{t('storyboard.step3.placeholder')}</p>
            </div>
            <button>{t('storyboard.step3.button')}</button>
          </div>
        </section>

        {/* Step 4: Visualization */}
        <section className="pipeline-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h2>{t('storyboard.step4.title')}</h2>
            <p>{t('storyboard.step4.description')}</p>
            <div className="placeholder-box">
              <p>{t('storyboard.step4.placeholder')}</p>
            </div>
            <button disabled>{t('storyboard.step4.button')}</button>
          </div>
        </section>
      </div>

      <aside className="options-panel">
        <h3>{t('storyboard.options.title')}</h3>
        <div className="option">
          <label htmlFor="image-style">{t('storyboard.options.imageStyle')}</label>
          <select id="image-style">
            <option>{t('storyboard.options.styles.webtoon')}</option>
            <option>{t('storyboard.options.styles.photorealistic')}</option>
            <option>{t('storyboard.options.styles.watercolor')}</option>
          </select>
        </div>
        <div className="option">
          <label htmlFor="tone">{t('storyboard.options.tone')}</label>
          <select id="tone">
            <option>{t('storyboard.options.tones.humorous')}</option>
            <option>{t('storyboard.options.tones.tragic')}</option>
            <option>{t('storyboard.options.tones.serious')}</option>
          </select>
        </div>
        <div className="option character-lock">
          <input type="checkbox" id="char-lock" />
          <label htmlFor="char-lock">★ {t('storyboard.options.characterLock')}</label>
        </div>
      </aside>
    </div>
  );
};

export default AIStoryboard;
