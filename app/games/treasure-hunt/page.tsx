"use client";

import { useState } from "react";
import GameShell from "@/app/components/common/GameShell";
import { initializeGame, uncoverTile, GameState, GameConfig, validateGameConfig } from "./gameLogic";

export default function TreasureHuntPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [gridSize, setGridSize] = useState(3);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2']);
  const [configError, setConfigError] = useState<string>('');

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    // Adjust player names array to match count
    const newNames = Array(count).fill(null).map((_, i) => 
      playerNames[i] || `Player ${i + 1}`
    );
    setPlayerNames(newNames);
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    const config: GameConfig = {
      playerCount,
      playerNames,
      gridSize,
    };

    const validation = validateGameConfig(config);
    if (!validation.valid) {
      setConfigError(validation.error || 'Invalid configuration');
      return;
    }

    setConfigError('');
    setGameState(initializeGame(config));
  };

  const handleTileClick = (position: number) => {
    if (!gameState) return;
    const newState = uncoverTile(gameState, position);
    setGameState(newState);
  };

  const handleReset = () => {
    setGameState(null);
    setConfigError('');
  };

  const getTileContent = (index: number) => {
    if (!gameState) return null;
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
    if (!gameState) return '';
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
    if (!gameState) return null;
    if (gameState.isGameOver && gameState.winner) {
      const winnerName = gameState.playerNames[gameState.winner - 1];
      return (
        <div className="text-center py-4">
          <div className="text-5xl mb-2">🎉</div>
          <p className="text-2xl font-bold text-green-600">
            {winnerName} Wins!
          </p>
        </div>
      );
    }

    const currentPlayerName = gameState.playerNames[gameState.currentPlayer - 1];
    return (
      <div className="text-center py-4">
        <p className="text-xl font-semibold text-gray-900">
          {currentPlayerName}&apos;s Turn
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Click a tile to search for treasure
        </p>
      </div>
    );
  };

  // Configuration screen
  if (!gameState) {
    const maxPlayers = Math.min(6, Math.floor((gridSize * gridSize) / 2));
    
    return (
      <GameShell
        title="Treasure Hunt"
        description="Configure your game and start the hunt for treasure!"
      >
        <div className="space-y-6 max-w-lg mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Game Configuration</h3>
            
            {/* Grid Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grid Size
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 4, 5, 6].map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                      gridSize === size
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {gridSize}×{gridSize} grid = {gridSize * gridSize} tiles
              </p>
            </div>

            {/* Player Count Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Players (max {maxPlayers})
              </label>
              <input
                type="number"
                min="1"
                max={maxPlayers}
                value={playerCount}
                onChange={(e) => handlePlayerCountChange(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Player Names */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Player Names
              </label>
              <div className="space-y-2">
                {playerNames.map((name, index) => (
                  <input
                    key={index}
                    type="text"
                    value={name}
                    onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                    placeholder={`Player ${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {configError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {configError}
              </div>
            )}

            {/* Start Game Button */}
            <button
              onClick={handleStartGame}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
            >
              Start Game
            </button>
          </div>

          {/* Game Rules */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            <h3 className="font-semibold mb-2">Game Rules:</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Players take turns clicking tiles</li>
              <li>One tile contains a hidden treasure 💎</li>
              <li>The first player to find the treasure wins!</li>
              <li>Covered tiles show a shrub 🌳</li>
            </ul>
          </div>
        </div>
      </GameShell>
    );
  }

  // Game screen
  return (
    <GameShell
      title="Treasure Hunt"
      description="Take turns uncovering tiles to find the hidden treasure!"
    >
      <div className="space-y-6">
        {/* Status Message */}
        <div className="bg-blue-50 rounded-lg p-4">
          {getStatusMessage()}
        </div>

        {/* Game Grid */}
        <div 
          className={`grid gap-4 max-w-2xl mx-auto`}
          style={{
            gridTemplateColumns: `repeat(${gameState.gridSize}, minmax(0, 1fr))`,
          }}
        >
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
            New Game
          </button>
        )}

        {/* Game Info */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold">Grid:</span> {gameState.gridSize}×{gameState.gridSize}
            </div>
            <div>
              <span className="font-semibold">Players:</span> {gameState.playerCount}
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
