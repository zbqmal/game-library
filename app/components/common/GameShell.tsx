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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6 font-semibold transition-colors"
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
          <h1 className="text-4xl md:text-5xl font-bold text-purple-600 mb-3">
            {title}
          </h1>
          <p className="text-lg text-gray-600">{description}</p>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className={scoreboard ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
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
