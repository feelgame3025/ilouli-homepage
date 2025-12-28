import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSelector.css';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', short: 'EN' },
    { code: 'ko', name: '한국어', flag: '🇰🇷', short: 'KO' },
  ];

  const currentLang = languages.find(lang => lang.code === i18n.language) || languages[1];

  const changeLanguage = async (langCode) => {
    if (langCode === i18n.language) {
      setIsOpen(false);
      return;
    }
    setIsChanging(true);
    try {
      await i18n.changeLanguage(langCode);
      localStorage.setItem('i18nextLng', langCode);
    } finally {
      setIsChanging(false);
      setIsOpen(false);
    }
  };

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className={`lang-trigger ${isChanging ? 'changing' : ''}`}
        onClick={() => !isChanging && setIsOpen(!isOpen)}
        aria-label="언어 선택"
        disabled={isChanging}
      >
        <span className="lang-code">{currentLang.short}</span>
        <svg className={`lang-arrow ${isOpen ? 'open' : ''}`} width="10" height="6" viewBox="0 0 10 6">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </button>

      {isOpen && (
        <div className="lang-dropdown">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`lang-option ${i18n.language === lang.code ? 'active' : ''}`}
              disabled={isChanging}
            >
              <span className="lang-code-option">{lang.short}</span>
              <span className="lang-name">{lang.name}</span>
              {i18n.language === lang.code && <span className="lang-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
