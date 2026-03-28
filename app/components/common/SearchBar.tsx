"use client";

import { useState, useEffect } from "react";
import { useGameLibraryTranslations } from "@/app/translation-engine";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchBar({
  onSearch,
  placeholder,
  debounceMs = 200,
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const { texts } = useGameLibraryTranslations();
  const resolvedPlaceholder = placeholder ?? texts.inputPlaceholder;

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, onSearch, debounceMs]);

  const handleClear = () => {
    setQuery("");
  };

  return (
    <div className="relative max-w-2xl mx-auto">
      <label htmlFor="game-search" className="sr-only">
        {texts.searchLabel}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          id="game-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full pl-10 pr-12 py-3 border border-white/[0.12] rounded-xl bg-slate-900/70 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
          placeholder={resolvedPlaceholder}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={texts.clearSearchLabel}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      {query && (
        <p className="mt-2 text-sm text-slate-500">
          {texts.searchingForLabel}{" "}
          <span className="font-semibold text-slate-300">{query}</span>
        </p>
      )}
    </div>
  );
}
