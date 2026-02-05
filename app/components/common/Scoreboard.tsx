"use client";

import { useEffect, useState } from "react";
import { scoreboardAdapter, ScoreEntry } from "../../lib/scoreboard";

interface ScoreboardProps {
  gameId: string;
  title?: string;
}

export default function Scoreboard({
  gameId,
  title = "Top 10 Scoreboard",
}: ScoreboardProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);

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
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-purple-600 mb-4">{title}</h2>

      {scores.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No scores yet!</p>
          <p className="text-sm mt-2">Be the first to play and set a record.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {scores.map((entry, index) => (
            <div
              key={`${entry.name}-${entry.timestamp}`}
              className={`flex items-center justify-between p-3 rounded-lg ${
                index === 0
                  ? "bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-400"
                  : index === 1
                    ? "bg-gradient-to-r from-gray-200 to-gray-100 border-2 border-gray-400"
                    : index === 2
                      ? "bg-gradient-to-r from-orange-100 to-orange-50 border-2 border-orange-400"
                      : "bg-gray-50 border border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    index === 0
                      ? "bg-yellow-400 text-yellow-900"
                      : index === 1
                        ? "bg-gray-400 text-gray-900"
                        : index === 2
                          ? "bg-orange-400 text-orange-900"
                          : "bg-purple-200 text-purple-900"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{entry.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(entry.timestamp)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-purple-600">
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
