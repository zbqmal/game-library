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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-300 dark:bg-gray-700" />
      <div className="p-4">
        <div className="h-5 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-3/4" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-1 w-full" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
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
        <div className="inline-block bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
            🔍 {texts.noResultsMessage}
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">
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
