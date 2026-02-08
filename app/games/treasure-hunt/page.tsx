"use client";

import { useState } from "react";
import GameShell from "@/app/components/common/GameShell";
import { useGameLibraryTranslations } from "@/app/translation-engine";
import { interpolate } from "@/app/lib/utils";
import {
  initializeGame,
  uncoverTile,
  GameState,
  GameConfig,
  validateGameConfig,
} from "./gameLogic";

export default function TreasureHuntPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [gridSize, setGridSize] = useState(3);
  const { texts } = useGameLibraryTranslations();
  const [playerNames, setPlayerNames] = useState<string[]>(() => [
    interpolate(texts.treasurePlayerPlaceholder, { number: 1 }),
    interpolate(texts.treasurePlayerPlaceholder, { number: 2 }),
  ]);
  const [configError, setConfigError] = useState<string>("");

  const maxPlayers = Math.min(6, Math.floor((gridSize * gridSize) / 2));
  const isValidPlayerCount =
    playerCount >= 2 && playerCount <= 6 && playerCount <= maxPlayers;
  const isValidPlayerNames =
    playerNames.length === playerCount &&
    playerNames.every((name) => name.trim().length <= 20);
  const isFormValid = isValidPlayerCount && isValidPlayerNames;

  const handlePlayerCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Allow empty string for user to delete and retype
    if (value === "") {
      setPlayerCount(0);
      setPlayerNames([]);
      return;
    }

    // Parse to remove leading zeros and ensure clean number
    const parsedCount = parseInt(value, 10);
    if (isNaN(parsedCount) || parsedCount < 0) return;

    // Set the count without clamping - let validation handle out-of-range values
    setPlayerCount(parsedCount);
    // Force the input to display the normalized value without leading zeros
    e.currentTarget.value = String(parsedCount);

    // Only adjust player names if count is valid (prevents creating too many DOM elements)
    if (parsedCount >= 2 && parsedCount <= 6 && parsedCount <= maxPlayers) {
      const newNames = Array(parsedCount)
        .fill(null)
        .map(
          (_, i) =>
            playerNames[i] ||
            interpolate(texts.treasurePlayerPlaceholder, { number: i + 1 }),
        );
      setPlayerNames(newNames);
    }
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    // Enforce max length of 20 characters
    const truncatedName = name.slice(0, 20);
    const newNames = [...playerNames];
    newNames[index] = truncatedName;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    // Assign default names to empty entries
    const finalNames = playerNames.map((name, i) =>
      name.trim() === ""
        ? interpolate(texts.treasurePlayerPlaceholder, { number: i + 1 })
        : name,
    );

    const config: GameConfig = {
      playerCount,
      playerNames: finalNames,
      gridSize,
    };

    const validation = validateGameConfig(config);
    if (!validation.valid) {
      setConfigError(validation.error || texts.treasureInvalidConfig);
      return;
    }

    setConfigError("");
    setGameState(initializeGame(config));
  };

  const handleTileClick = (position: number) => {
    if (!gameState) return;
    const newState = uncoverTile(gameState, position);
    setGameState(newState);
  };

  const handleReset = () => {
    setGameState(null);
    setConfigError("");
  };

  const getTileContent = (index: number) => {
    if (!gameState) return null;
    const tileState = gameState.tiles[index];

    if (tileState === "covered") {
      // Show shrub for covered tiles
      return <div className="text-6xl">🌳</div>;
    }

    if (tileState === "uncovered-treasure") {
      // Show treasure
      return <div className="text-6xl">💎</div>;
    }

    // Empty uncovered tile
    return <div className="text-6xl opacity-30">🕳️</div>;
  };

  const getTileClassName = (index: number) => {
    if (!gameState) return "";
    const tileState = gameState.tiles[index];
    const baseClasses =
      "aspect-square flex items-center justify-center rounded-lg transition-all";

    if (tileState === "covered") {
      return `${baseClasses} bg-green-100 border-4 border-green-400 hover:border-green-600 hover:bg-green-200 cursor-pointer active:scale-95`;
    }

    if (tileState === "uncovered-treasure") {
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
            {interpolate(texts.treasureWinnerMessage, { name: winnerName })}
          </p>
        </div>
      );
    }

    const currentPlayerName =
      gameState.playerNames[gameState.currentPlayer - 1];
    return (
      <div className="text-center py-4">
        <p className="text-xl font-semibold text-gray-900">
          {interpolate(texts.treasureTurnMessage, { name: currentPlayerName })}
        </p>
        <p className="text-sm text-gray-600 mt-1">{texts.treasureTurnHint}</p>
      </div>
    );
  };

  // Configuration screen
  if (!gameState) {
    return (
      <GameShell
        title={texts.treasureGameTitle}
        description={texts.treasureDescriptionConfig}
      >
        <div className="space-y-6 max-w-lg mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              {texts.treasureConfigTitle}
            </h3>

            {/* Grid Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {texts.treasureGridSizeLabel}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 4, 5, 6].map((size) => (
                  <button
                    key={size}
                    onClick={() => setGridSize(size)}
                    className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                      gridSize === size
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {size}×{size}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {interpolate(texts.treasureGridInfo, {
                  size: gridSize,
                  tiles: gridSize * gridSize,
                })}
              </p>
            </div>

            {/* Player Count Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {interpolate(texts.treasurePlayerCountLabel, {
                  max: maxPlayers,
                })}
              </label>
              <input
                type="number"
                max="6"
                value={playerCount}
                onChange={(e) => handlePlayerCountChange(e)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  isValidPlayerCount && playerCount > 0
                    ? "border-gray-300 focus:ring-blue-500"
                    : "border-red-300 focus:ring-red-500"
                }`}
              />
              {playerCount > 0 && !isValidPlayerCount && (
                <p className="text-xs text-red-600 mt-1">
                  {interpolate(texts.treasurePlayerCountError, {
                    max: maxPlayers,
                  })}
                </p>
              )}
            </div>

            {/* Player Names - Only show when player count is valid */}
            {isValidPlayerCount && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {texts.treasurePlayerNamesLabel}
                </label>
                <div className="space-y-2">
                  {playerNames.map((name, index) => (
                    <div key={index}>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) =>
                          handlePlayerNameChange(index, e.target.value)
                        }
                        placeholder={interpolate(
                          texts.treasurePlayerPlaceholder,
                          {
                            number: index + 1,
                          },
                        )}
                        maxLength={20}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                          name.trim().length <= 20
                            ? "border-gray-300 focus:ring-blue-500"
                            : "border-red-300 focus:ring-red-500"
                        }`}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {name.length}/20 {texts.characterCountLabel}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {configError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {configError}
              </div>
            )}

            {/* Start Game Button */}
            <button
              onClick={handleStartGame}
              disabled={!isFormValid}
              className={`w-full py-3 rounded-lg transition-colors font-semibold text-lg ${
                isFormValid
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {texts.treasureStartGame}
            </button>
          </div>

          {/* Game Rules */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
            <h3 className="font-semibold mb-2">{texts.treasureRulesTitle}</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>{texts.treasureRuleTurns}</li>
              <li>{texts.treasureRuleHidden}</li>
              <li>{texts.treasureRuleWin}</li>
              <li>{texts.treasureRuleCovered}</li>
            </ul>
          </div>
        </div>
      </GameShell>
    );
  }

  // Game screen
  return (
    <GameShell
      title={texts.treasureGameTitle}
      description={texts.treasureDescriptionPlay}
    >
      <div className="space-y-6">
        {/* Status Message */}
        <div className="bg-blue-50 rounded-lg p-4">{getStatusMessage()}</div>

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
              disabled={
                gameState.tiles[index] !== "covered" || gameState.isGameOver
              }
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
            {texts.treasureNewGame}
          </button>
        )}

        {/* Game Info */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold">{texts.treasureGridLabel}</span>{" "}
              {gameState.gridSize}×{gameState.gridSize}
            </div>
            <div>
              <span className="font-semibold">
                {texts.treasurePlayersLabel}
              </span>{" "}
              {gameState.playerCount}
            </div>
          </div>
        </div>
      </div>
    </GameShell>
  );
}
