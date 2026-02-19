"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GameShell from "@/app/components/common/GameShell";
import LoadingSpinner from "@/app/components/common/LoadingSpinner";
import { useGameLibraryTranslations } from "@/app/translation-engine";
import { interpolate } from "@/app/lib/utils";
import {
  initializeGame,
  uncoverTile,
  GameState,
  GameConfig,
  validateGameConfig,
} from "./gameLogic";

// Session storage keys shared with the room page
const SESSION_KEYS = {
  PLAYER_ID: "treasure-hunt-player-id",
  ROOM_CODE: "treasure-hunt-room-code",
  USERNAME: "treasure-hunt-username",
  TIMESTAMP: "treasure-hunt-timestamp",
};

export default function TreasureHuntPage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerCount, setPlayerCount] = useState(2);
  const [gridSize, setGridSize] = useState(3);
  const { texts } = useGameLibraryTranslations();
  const [playerNames, setPlayerNames] = useState<string[]>(() => [
    interpolate(texts.treasurePlayerPlaceholder, { number: 1 }),
    interpolate(texts.treasurePlayerPlaceholder, { number: 2 }),
  ]);
  const [configError, setConfigError] = useState<string>("");

  // Tab state
  const [activeTab, setActiveTab] = useState<"offline" | "online">("offline");

  // Online lobby state
  const [onlineUsername, setOnlineUsername] = useState("");
  const [onlineJoinCode, setOnlineJoinCode] = useState("");
  const [onlineSelectedMaxPlayers, setOnlineSelectedMaxPlayers] = useState(4);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState("");

  // Load persisted username from session storage
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEYS.USERNAME);
    if (saved) setOnlineUsername(saved);
  }, []);

  // 3x3 grid allows max 4 players, all other sizes allow max 6 players
  const maxPlayers = gridSize === 3 ? 4 : 6;
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
        <p className="text-sm text-gray-700 mt-1">{texts.treasureTurnHint}</p>
      </div>
    );
  };

  // Online lobby handlers
  const handleOnlineUsernameChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value.slice(0, 20);
    setOnlineUsername(value);
    sessionStorage.setItem(SESSION_KEYS.USERNAME, value);
  };

  const handleOnlineCreateRoom = async () => {
    if (!onlineUsername.trim()) {
      setOnlineError("Please enter your username");
      return;
    }

    setOnlineLoading(true);
    setOnlineError("");

    try {
      const response = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: onlineUsername.trim(),
          maxPlayers: onlineSelectedMaxPlayers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create room");
      }

      sessionStorage.setItem(SESSION_KEYS.PLAYER_ID, data.playerId);
      sessionStorage.setItem(SESSION_KEYS.ROOM_CODE, data.roomCode);
      sessionStorage.setItem(SESSION_KEYS.USERNAME, onlineUsername.trim());
      sessionStorage.setItem(SESSION_KEYS.TIMESTAMP, Date.now().toString());

      router.push(`/games/treasure-hunt/online/${data.roomCode}`);
    } catch (err) {
      setOnlineError(
        err instanceof Error
          ? err.message
          : "Failed to create room. Please try again.",
      );
    } finally {
      setOnlineLoading(false);
    }
  };

  const handleOnlineJoinRoom = async () => {
    if (!onlineUsername.trim()) {
      setOnlineError("Please enter your username");
      return;
    }

    if (!onlineJoinCode.trim()) {
      setOnlineError("Please enter a room code");
      return;
    }

    setOnlineLoading(true);
    setOnlineError("");

    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: onlineJoinCode.trim().toUpperCase(),
          username: onlineUsername.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Room not found. Please check the code and try again.",
          );
        } else if (response.status === 400 && data.error?.includes("full")) {
          throw new Error("This room is full. Please try a different room.");
        }
        throw new Error(data.error || "Failed to join room");
      }

      const roomCodeUpper = onlineJoinCode.trim().toUpperCase();
      sessionStorage.setItem(SESSION_KEYS.PLAYER_ID, data.playerId);
      sessionStorage.setItem(SESSION_KEYS.ROOM_CODE, roomCodeUpper);
      sessionStorage.setItem(SESSION_KEYS.USERNAME, onlineUsername.trim());
      sessionStorage.setItem(SESSION_KEYS.TIMESTAMP, Date.now().toString());

      router.push(`/games/treasure-hunt/online/${roomCodeUpper}`);
    } catch (err) {
      setOnlineError(
        err instanceof Error
          ? err.message
          : "Failed to join room. Please try again.",
      );
    } finally {
      setOnlineLoading(false);
    }
  };

  // Configuration screen
  if (!gameState) {
    return (
      <GameShell
        title={texts.treasureGameTitle}
        description={texts.treasureDescriptionConfig}
      >
        <div className="space-y-6 max-w-lg mx-auto">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("offline")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === "offline"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {texts.treasureTabOffline}
            </button>
            <button
              onClick={() => setActiveTab("online")}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === "online"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🌐 {texts.treasureTabOnline}
            </button>
          </div>

          {/* Offline Multiplayer Tab */}
          {activeTab === "offline" && (
            <>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {texts.treasureConfigTitle}
                </h3>

                {/* Grid Size Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
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
                            : "border-gray-300 hover:border-gray-400 text-gray-400"
                        }`}
                      >
                        {size}×{size}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-700 mt-1">
                    {interpolate(texts.treasureGridInfo, {
                      size: gridSize,
                      tiles: gridSize * gridSize,
                    })}
                  </p>
                </div>

                {/* Player Count Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {interpolate(texts.treasurePlayerCountLabel, {
                      max: maxPlayers,
                    })}
                  </label>
                  <input
                    type="number"
                    max="6"
                    value={playerCount}
                    onChange={(e) => handlePlayerCountChange(e)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 ${
                      isValidPlayerCount && playerCount > 0
                        ? "border-gray-300 focus:ring-blue-500"
                        : "border-red-300 focus:ring-red-500"
                    }`}
                  />
                  {playerCount > 0 && !isValidPlayerCount && (
                    <p className="text-xs text-red-600 mt-1">
                      {playerCount < 2
                        ? "At least 2 players required"
                        : playerCount > maxPlayers
                          ? `Maximum ${maxPlayers} players for ${gridSize}×${gridSize} grid`
                          : "Invalid player count"}
                    </p>
                  )}
                </div>

                {/* Player Names - Only show when player count is valid */}
                {isValidPlayerCount && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
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
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 placeholder-gray-400 text-gray-900 ${
                              name.trim().length <= 20
                                ? "border-gray-300 focus:ring-blue-500"
                                : "border-red-300 focus:ring-red-500"
                            }`}
                          />
                          <p className="text-xs text-gray-700 mt-1">
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
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800">
                <h3 className="font-semibold mb-2">{texts.treasureRulesTitle}</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>{texts.treasureRuleTurns}</li>
                  <li>{texts.treasureRuleHidden}</li>
                  <li>{texts.treasureRuleWin}</li>
                  <li>{texts.treasureRuleCovered}</li>
                </ul>
              </div>
            </>
          )}

          {/* Online Multiplayer Tab */}
          {activeTab === "online" && (
            <div className="space-y-4">
              {/* Username Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  htmlFor="online-username-input"
                >
                  Your Username
                </label>
                <input
                  id="online-username-input"
                  type="text"
                  value={onlineUsername}
                  onChange={handleOnlineUsernameChange}
                  placeholder="Enter your name"
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-gray-900"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {onlineUsername.length}/20 {texts.characterCountLabel}
                </p>
              </div>

              {/* Create New Room Section (includes Number of Players) */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Create New Room
                </h3>

                {/* Number of Players */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Number of Players
                  </label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {[2, 3, 4, 5, 6].map((count) => (
                      <button
                        key={count}
                        onClick={() => setOnlineSelectedMaxPlayers(count)}
                        className={`py-2 px-3 rounded-lg border-2 transition-colors font-semibold min-h-[44px] touch-manipulation ${
                          onlineSelectedMaxPlayers === count
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                        aria-label={`Select ${count} players`}
                        aria-pressed={onlineSelectedMaxPlayers === count}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600">
                    Maximum {onlineSelectedMaxPlayers} players can join this
                    room
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span aria-label="Information">ℹ</span> The number of
                    players cannot be changed after the room is created.
                  </p>
                </div>

                <button
                  onClick={handleOnlineCreateRoom}
                  disabled={onlineLoading || !onlineUsername.trim()}
                  className={`w-full py-3 rounded-lg transition-colors font-semibold text-lg min-h-[44px] touch-manipulation ${
                    onlineLoading || !onlineUsername.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700 active:scale-95"
                  }`}
                  aria-label="Create a new game room"
                >
                  {onlineLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Creating...
                    </span>
                  ) : (
                    "Create Room"
                  )}
                </button>
              </div>

              {/* Join Existing Room Section */}
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Join Existing Room
                </h3>
                <input
                  type="text"
                  value={onlineJoinCode}
                  onChange={(e) =>
                    setOnlineJoinCode(e.target.value.toUpperCase())
                  }
                  placeholder="Enter 6-character room code"
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3 uppercase placeholder-gray-400 text-gray-900"
                  autoComplete="off"
                  aria-label="Room code input"
                />
                <button
                  onClick={handleOnlineJoinRoom}
                  disabled={
                    onlineLoading ||
                    !onlineUsername.trim() ||
                    !onlineJoinCode.trim()
                  }
                  className={`w-full py-3 rounded-lg transition-colors font-semibold text-lg min-h-[44px] touch-manipulation ${
                    onlineLoading ||
                    !onlineUsername.trim() ||
                    !onlineJoinCode.trim()
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                  }`}
                  aria-label="Join game room"
                >
                  {onlineLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <LoadingSpinner size="sm" />
                      Joining...
                    </span>
                  ) : (
                    "Join Room"
                  )}
                </button>
              </div>

              {/* Error Message */}
              {onlineError && (
                <div
                  className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm"
                  role="alert"
                >
                  {onlineError}
                </div>
              )}

              {/* Quick Tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <div className="flex items-start gap-2">
                  <span className="text-xl">💡</span>
                  <div className="flex-1">
                    <p className="font-medium mb-1">Quick Tips:</p>
                    <ul className="text-xs space-y-1 text-blue-800">
                      <li>• Rooms expire after 1 hour of inactivity</li>
                      <li>• You can share room links with friends</li>
                      <li>• Your username is saved automatically</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
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
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800">
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
