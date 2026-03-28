"use client";

import { useEffect, useState } from "react";
import { scoreboardAdapter, ScoreEntry } from "../../lib/scoreboard";
import { useGameLibraryTranslations } from "@/app/translation-engine";

interface ScoreboardProps {
  gameId: string;
  title?: string;
}

export default function Scoreboard({ gameId, title }: ScoreboardProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const { texts, activeLangCode } = useGameLibraryTranslations();

  const resolvedTitle = title ?? texts.scoreboardTitle;

  useEffect(() => {
    const loadScores = async () => {
      const topScores = await scoreboardAdapter.getTopScores(gameId, 10);
      setScores(topScores);
    };

    loadScores();

    // Listen for custom scoreboard update events
    const handleScoreUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.gameId === gameId) {
        loadScores();
      }
    };

    window.addEventListener("scoreboardUpdated", handleScoreUpdate);

    return () => {
      window.removeEventListener("scoreboardUpdated", handleScoreUpdate);
    };
  }, [gameId]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const localeMap = {
      en: "en-US",
      es: "es-ES",
      ko: "ko-KR",
    } as const;
    return date.toLocaleDateString(localeMap[activeLangCode], {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-white/[0.08] rounded-xl shadow-md p-6">
      <h2 className="text-2xl font-bold text-violet-400 mb-4">
        {resolvedTitle}
      </h2>

      {scores.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p className="text-lg">{texts.scoreboardEmptyTitle}</p>
          <p className="text-sm mt-2">{texts.scoreboardEmptySubtitle}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scores.map((entry, index) => (
            <div
              key={`${entry.name}-${entry.timestamp}`}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                index === 0
                  ? "bg-amber-500/10 border-amber-500/30"
                  : index === 1
                    ? "bg-slate-400/10 border-slate-400/20"
                    : index === 2
                      ? "bg-orange-500/10 border-orange-500/20"
                      : "bg-white/[0.03] border-white/[0.06]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                    index === 0
                      ? "bg-amber-500 text-amber-950"
                      : index === 1
                        ? "bg-slate-400 text-slate-900"
                        : index === 2
                          ? "bg-orange-500 text-orange-950"
                          : "bg-violet-500/20 text-violet-300"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{entry.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(entry.timestamp)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-violet-400">
                  {entry.score}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
