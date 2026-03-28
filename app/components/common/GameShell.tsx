"use client";

import Link from "next/link";
import { useGameLibraryTranslations } from "@/app/translation-engine";

interface GameShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
  scoreboard?: React.ReactNode;
}

export default function GameShell({
  title,
  description,
  children,
  scoreboard,
}: GameShellProps) {
  const { texts } = useGameLibraryTranslations();

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center text-violet-400 hover:text-violet-300 mb-6 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0a0a14] rounded-md"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          {texts.linkBackHome}
        </Link>

        {/* Game Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 mb-3">
            {title}
          </h1>
          <p className="text-lg text-slate-400">{description}</p>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className={scoreboard ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-slate-900/80 backdrop-blur-sm border border-white/[0.08] rounded-xl shadow-lg p-6 md:p-8">
              {children}
            </div>
          </div>

          {/* Scoreboard Area (if provided) */}
          {scoreboard && <div className="lg:col-span-1">{scoreboard}</div>}
        </div>
      </div>
    </div>
  );
}
