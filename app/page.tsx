"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import Header from "./components/common/Header";
import SearchBar from "./components/common/SearchBar";
import GameGrid from "./components/common/GameGrid";
import VisitCounter from "./components/common/VisitCounter";
import { games } from "./data/games";

let lastTrackedPage: string | null = null;
let lastTrackedAt = 0;

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

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

  // Memoize Fuse instance to avoid recreating on every render
  const fuse = useMemo(() => {
    return new Fuse(games, {
      keys: ["title", "description", "tags"],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, []);

  const filteredGames = useMemo(() => {
    return searchQuery
      ? fuse.search(searchQuery).map((result) => result.item)
      : games;
  }, [searchQuery, fuse]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Enjoy a collection of fun mini-games and challenge yourself to beat
            other players&apos; scores!
          </p>

          <SearchBar onSearch={handleSearch} />

          <div className="mt-4 flex justify-center">
            <VisitCounter page="home" />
          </div>
        </div>
        <GameGrid games={filteredGames} />
      </main>

      <footer className="mt-auto py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 Game Library. Built with Next.js</p>
      </footer>
    </div>
  );
}
