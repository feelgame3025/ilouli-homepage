import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'EN' },
    { code: 'ko', name: '한' },
    { code: 'ja', name: '日' },
    { code: 'zh', name: '中' },
  ];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  return (
    <div className="language-selector">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`lang-btn ${i18n.language === lang.code ? 'active' : ''}`}
          title={t(`language.${lang.code}`)}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
