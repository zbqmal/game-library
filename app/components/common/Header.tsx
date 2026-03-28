"use client";

import { useGameLibraryTranslations } from '@/app/translation-engine';

export default function Header() {
  const { texts } = useGameLibraryTranslations();

  return (
    <header className="w-full bg-gradient-to-r from-violet-950 to-indigo-950 text-white shadow-lg border-b border-white/[0.06] animate-glow-pulse">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
          {texts.mainHeading}
        </h1>
      </div>
    </header>
  );
}
