"use client";

import { useState } from "react";
import GameShell from "@/app/components/common/GameShell";
import { initializeGame, uncoverTile, GameState } from "./gameLogic";

export default function TreasureHuntPage() {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());

  const handleTileClick = (position: number) => {
    const newState = uncoverTile(gameState, position);
    setGameState(newState);
  };

  const handleReset = () => {
    setGameState(initializeGame());
  };

  const getTileContent = (index: number) => {
    const tileState = gameState.tiles[index];
    
    if (tileState === 'covered') {
      // Show shrub for covered tiles
      return (
        <div className="text-6xl">🌳</div>
      );
    }
    
    if (tileState === 'uncovered-treasure') {
      // Show treasure
      return (
        <div className="text-6xl">💎</div>
      );
    }
    
    // Empty uncovered tile
    return (
      <div className="text-6xl opacity-30">🕳️</div>
    );
  };

  const getTileClassName = (index: number) => {
    const tileState = gameState.tiles[index];
    const baseClasses = "aspect-square flex items-center justify-center rounded-lg transition-all";
    
    if (tileState === 'covered') {
      return `${baseClasses} bg-green-100 border-4 border-green-400 hover:border-green-600 hover:bg-green-200 cursor-pointer active:scale-95`;
    }
    
    if (tileState === 'uncovered-treasure') {
      return `${baseClasses} bg-yellow-100 border-4 border-yellow-400`;
    }
    
    // Empty uncovered
    return `${baseClasses} bg-gray-100 border-4 border-gray-300`;
  };

  const getStatusMessage = () => {
    if (gameState.isGameOver && gameState.winner) {
      return (
        <div className="text-center py-4">
          <div className="text-5xl mb-2">🎉</div>
          <p className="text-2xl font-bold text-green-600">
            Player {gameState.winner} Wins!
          </p>
          <p className="text-lg text-gray-700 mt-2">
            Player {gameState.winner === 1 ? 2 : 1} loses
          </p>
        </div>
      );
    }

    return (
      <div className="text-center py-4">
        <p className="text-xl font-semibold text-gray-900">
          Player {gameState.currentPlayer}&apos;s Turn
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Click a tile to search for treasure
        </p>
      </div>
    );
  };

  return (
    <GameShell
      title="Treasure Hunt"
      description="Two players take turns uncovering tiles to find the hidden treasure!"
    >
      <div className="space-y-6">
        {/* Status Message */}
        <div className="bg-blue-50 rounded-lg p-4">
          {getStatusMessage()}
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
          {gameState.tiles.map((_, index) => (
            <button
              key={index}
              onClick={() => handleTileClick(index)}
              disabled={gameState.tiles[index] !== 'covered' || gameState.isGameOver}
              className={getTileClassName(index)}
            >
              {getTileContent(index)}
            </button>
          ))}
        </div>

        {/* Reset Button */}
        {gameState.isGameOver && (
          <button
            onClick={handleReset}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
          >
            Play Again
          </button>
        )}

        {/* Game Rules */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
          <h3 className="font-semibold mb-2">Game Rules:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Two players take turns clicking tiles</li>
            <li>One tile contains a hidden treasure 💎</li>
            <li>The player who finds the treasure wins!</li>
            <li>Covered tiles show a shrub 🌳</li>
          </ul>
        </div>
      </div>
    </GameShell>
  );
}
