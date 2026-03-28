"use client";

import Link from "next/link";
import LanguageDropdown from "./LanguageDropdown";
import { useGameLibraryTranslations } from "@/app/translation-engine";

export default function TopNav() {
  const { texts } = useGameLibraryTranslations();

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#0a0a14]/90 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-violet-400 hover:text-violet-300 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0a0a14] rounded-md px-1"
        >
          {/* Render full mainHeading which includes the emoji (e.g. "🎮 Game Library") */}
          <span>{texts.mainHeading}</span>
        </Link>
        <LanguageDropdown />
      </div>
    </nav>
  );
}
