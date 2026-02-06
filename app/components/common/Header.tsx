"use client";

import { useGameLibraryTranslations } from '@/app/translation-engine';
import LanguageDropdown from './LanguageDropdown';

export default function Header() {
  const { texts } = useGameLibraryTranslations();

  return (
    <header className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <h1 className="text-3xl md:text-4xl font-bold text-center flex-1">
            {texts.mainHeading}
          </h1>
          <div className="flex-1 flex justify-end">
            <LanguageDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
