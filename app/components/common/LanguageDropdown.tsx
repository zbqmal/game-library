"use client";

import { useGameLibraryTranslations } from '@/app/translation-engine';

export default function LanguageDropdown() {
  const { texts, activeLangCode, updateLanguage } = useGameLibraryTranslations();

  return (
    <div className="inline-block">
      <label htmlFor="language-dropdown" className="sr-only">
        {texts.languagePickerLabel}
      </label>
      <select
        id="language-dropdown"
        value={activeLangCode}
        onChange={(e) => updateLanguage(e.target.value as 'en' | 'es' | 'ko')}
        className="px-3 py-1.5 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-md text-sm font-medium hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer transition-colors"
        aria-label={texts.languagePickerLabel}
      >
        <option value="en" className="bg-purple-600">{texts.englishOption}</option>
        <option value="es" className="bg-purple-600">{texts.spanishOption}</option>
        <option value="ko" className="bg-purple-600">{texts.koreanOption}</option>
      </select>
    </div>
  );
}
