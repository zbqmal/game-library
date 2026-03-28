"use client";

import { Game } from "../../data/games";
import GameTile from "./GameTile";
import { useGameLibraryTranslations } from "@/app/translation-engine";

interface GameGridProps {
  games: Game[];
  isLoading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-slate-900/70 border border-white/[0.06] rounded-xl shadow-md overflow-hidden animate-pulse">
      <div className="aspect-video bg-slate-800/80" />
      <div className="p-4">
        <div className="h-5 bg-slate-700/80 rounded mb-2 w-3/4" />
        <div className="h-4 bg-slate-700/80 rounded mb-1 w-full" />
        <div className="h-4 bg-slate-700/80 rounded w-5/6" />
      </div>
    </div>
  );
}

export default function GameGrid({ games, isLoading = false }: GameGridProps) {
  const { texts } = useGameLibraryTranslations();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-block bg-slate-900/70 border border-white/[0.08] rounded-xl shadow-lg p-8 border-dashed">
          <p className="text-slate-400 text-lg mb-2">
            🔍 {texts.noResultsMessage}
          </p>
          <p className="text-slate-500 text-sm">
            {texts.noResultsSuggestion}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => (
        <GameTile key={game.id} game={game} />
      ))}
    </div>
  );
}
