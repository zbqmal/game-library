'use client';

import { useState, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import GameGrid from "./components/GameGrid";
import { games } from "./data/games";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Memoize Fuse instance to avoid recreating on every render
  const fuse = useMemo(() => {
    return new Fuse(games, {
      keys: ['title', 'description', 'tags'],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, []);

  const filteredGames = searchQuery
    ? fuse.search(searchQuery).map(result => result.item)
    : games;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Enjoy a collection of fun mini-games and challenge yourself to beat other players&apos; scores!
          </p>
          
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Game Grid */}
        <GameGrid games={filteredGames} />
      </main>

      <footer className="mt-auto py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>© 2026 Game Library. Built with Next.js</p>
      </footer>
    </div>
  );
}
