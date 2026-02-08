"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import Header from "./components/common/Header";
import SearchBar from "./components/common/SearchBar";
import GameGrid from "./components/common/GameGrid";
import VisitCounter from "./components/common/VisitCounter";
import { games } from "./data/games";
import { useGameLibraryTranslations } from "./translation-engine";

let lastTrackedPage: string | null = null;
let lastTrackedAt = 0;

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { texts } = useGameLibraryTranslations();

  // Track page visit on mount
  useEffect(() => {
    const pageName = "home";

    // Prevent double tracking in React Strict Mode (dev) which mounts twice
    const now = Date.now();
    if (lastTrackedPage === pageName && now - lastTrackedAt < 1000) {
      return;
    }

    lastTrackedPage = pageName;
    lastTrackedAt = now;

    const trackVisit = async () => {
      try {
        await fetch("/api/analytics/track-visit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ page: pageName }),
        });
      } catch (error) {
        console.error("Failed to track visit:", error);
      }
    };

    trackVisit();
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const localizedGames = useMemo(() => {
    const gameKeyMap = {
      "up-and-down": {
        title: texts.upDownGameTitle,
        description: texts.upDownGameDescription,
      },
      "rock-paper-scissors": {
        title: texts.rpsGameTitle,
        description: texts.rpsGameDescription,
      },
      "treasure-hunt": {
        title: texts.treasureGameTitle,
        description: texts.treasureGameDescription,
      },
      "47": {
        title: texts.game47Title,
        description: texts.game47Description,
      },
    } as const;

    const tagKeyMap: Record<string, string> = {
      logic: texts.tagLogic,
      puzzle: texts.tagPuzzle,
      "single-player": texts.tagSolo,
      classic: texts.tagClassic,
      quick: texts.tagQuick,
      "two-player": texts.tagDuo,
      strategy: texts.tagStrategy,
      timing: texts.tagTiming,
      challenge: texts.tagChallenge,
    };

    return games.map((game) => {
      const translation = gameKeyMap[game.slug as keyof typeof gameKeyMap];
      return {
        ...game,
        title: translation?.title ?? game.title,
        description: translation?.description ?? game.description,
        tags: game.tags.map((tag) => tagKeyMap[tag] ?? tag),
      };
    });
  }, [texts]);

  // Memoize Fuse instance to avoid recreating on every render
  const fuse = useMemo(() => {
    return new Fuse(localizedGames, {
      keys: ["title", "description", "tags"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [localizedGames]);

  const filteredGames = useMemo(() => {
    return searchQuery
      ? fuse.search(searchQuery).map((result) => result.item)
      : localizedGames;
  }, [searchQuery, fuse, localizedGames]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            {texts.welcomeMessage}
          </p>

          <SearchBar onSearch={handleSearch} />

          <div className="mt-4 flex justify-center">
            <VisitCounter page="home" />
          </div>
        </div>
        <GameGrid games={filteredGames} />
      </main>

      <footer className="mt-auto py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>{texts.footerContent}</p>
      </footer>
    </div>
  );
}
