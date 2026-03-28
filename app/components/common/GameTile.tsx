"use client";

import Link from "next/link";
import Image from "next/image";
import { Game } from "../../data/games";
import {
  useGameLibraryTranslations,
  type TextMapping,
} from "@/app/translation-engine";

interface GameTileProps {
  game: Game;
}

export default function GameTile({ game }: GameTileProps) {
  const { texts } = useGameLibraryTranslations();

  const gameKeyMap: Record<
    string,
    { title: keyof TextMapping; description: keyof TextMapping }
  > = {
    "up-and-down": {
      title: "upDownGameTitle",
      description: "upDownGameDescription",
    },
    "rock-paper-scissors": {
      title: "rpsGameTitle",
      description: "rpsGameDescription",
    },
    "treasure-hunt": {
      title: "treasureGameTitle",
      description: "treasureGameDescription",
    },
    "47": { title: "game47Title", description: "game47Description" },
  };

  const tagKeyMap: Record<string, keyof TextMapping> = {
    logic: "tagLogic",
    puzzle: "tagPuzzle",
    "single-player": "tagSolo",
    classic: "tagClassic",
    quick: "tagQuick",
    "two-player": "tagDuo",
    strategy: "tagStrategy",
    timing: "tagTiming",
    challenge: "tagChallenge",
  };

  const translationKeys = gameKeyMap[game.slug];
  const displayTitle = translationKeys
    ? texts[translationKeys.title]
    : game.title;
  const displayDescription = translationKeys
    ? texts[translationKeys.description]
    : game.description;
  const displayTags = game.tags.map((tag) => {
    const mappedKey = tagKeyMap[tag];
    return mappedKey ? texts[mappedKey] : tag;
  });

  return (
    <Link
      href={game.route}
      className="group relative bg-slate-900/70 backdrop-blur-sm border border-white/[0.08] rounded-xl shadow-md hover:shadow-violet-500/20 hover:shadow-xl hover:border-violet-500/40 transition-all duration-300 overflow-hidden focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-[#0a0a14]"
    >
      <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900">
        <Image
          src={game.thumbnail}
          alt={`${displayTitle} game thumbnail`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {game.hasScoreboard && (
          <div className="absolute top-2 right-2 bg-amber-500/90 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
            <span>🏆</span>
            <span>{texts.scoreboardBadgeLabel}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-violet-300 transition-colors">
          {displayTitle}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-2">
          {displayDescription}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {displayTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-violet-500/15 text-violet-300 border border-violet-500/25 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
