"use client";

import { useState, useEffect } from 'react';
import { translationEngine, type TextMapping } from './TranslationEngine';

export function useGameLibraryTranslations() {
  const [texts, setTexts] = useState<TextMapping>(translationEngine.getTranslations());
  const [activeLangCode, setActiveLangCode] = useState(translationEngine.getActiveLanguage());

  useEffect(() => {
    const detachListener = translationEngine.attachListener(() => {
      setTexts(translationEngine.getTranslations());
      setActiveLangCode(translationEngine.getActiveLanguage());
    });
    
    return detachListener;
  }, []);

  const updateLanguage = (newLang: 'en' | 'es' | 'ko') => {
    translationEngine.changeLanguage(newLang);
  };

  return { texts, activeLangCode, updateLanguage };
}
