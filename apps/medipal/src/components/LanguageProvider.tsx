import React, { createContext, useState, useContext, useEffect } from 'react';
import en from './locales/en';
import es from './locales/es';
import hi from './locales/hi';
import bn from './locales/bn';
import bn_wb from './locales/bn_wb';
import ta from './locales/ta';
import te from './locales/te';
import mr from './locales/mr';

const translations = { en, es, hi, bn, bn_wb, ta, te, mr };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    } else {
      // Auto-detect from browser language
      const browserLang = navigator.language?.split('-')[0];
      const langMap = {
        'en': 'en',
        'es': 'es',
        'hi': 'hi',
        'bn': 'bn',
        'ta': 'ta',
        'te': 'te',
        'mr': 'mr'
      };
      if (langMap[browserLang]) {
        setLanguage(langMap[browserLang]);
        localStorage.setItem('app_language', langMap[browserLang]);
      }
    }
  }, []);

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      localStorage.setItem('app_language', lang);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (let k of keys) {
      value = value?.[k];
      if (!value) return key;
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);