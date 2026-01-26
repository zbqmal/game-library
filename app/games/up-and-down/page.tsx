"use client";

import { useState } from "react";
import GameShell from "@/app/components/GameShell";
import {
  initializeGame,
  processGuess,
  GameState,
  DEFAULT_CONFIG,
  GameConfig,
  SAFE_LIMITS,
} from "./gameLogic";

export default function NumberGuessPage() {
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [config, setConfig] = useState<GameConfig>(DEFAULT_CONFIG);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [minNumberInput, setMinNumberInput] = useState(
    String(DEFAULT_CONFIG.minNumber),
  );
  const [maxNumberInput, setMaxNumberInput] = useState(
    String(DEFAULT_CONFIG.maxNumber),
  );
  const [maxAttemptsInput, setMaxAttemptsInput] = useState(
    String(DEFAULT_CONFIG.maxAttempts),
  );

  const handleStartGame = () => {
    setGameState(initializeGame(config));
    setIsConfiguring(false);
  };

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameState) return;

    const guess = parseInt(inputValue, 10);

    if (isNaN(guess)) {
      return;
    }

    const newState = processGuess(gameState, guess, config);
    setGameState(newState);
    setInputValue("");
  };

  const handleReset = () => {
    setIsConfiguring(true);
    setGameState(null);
    setInputValue("");
  };

  const getMessage = () => {
    if (!gameState) return null;

    if (gameState.gameStatus === "won") {
      return (
        <div className="text-center py-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-green-600 mb-2">
            Congratulations!
          </h2>
          <p className="text-xl text-gray-700">
            You guessed the number{" "}
            <span className="font-bold">{gameState.secretNumber}</span>!
          </p>
        </div>
      );
    }

    if (gameState.gameStatus === "lost") {
      return (
        <div className="text-center py-6">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-3xl font-bold text-red-600 mb-2">Game Over!</h2>
          <p className="text-xl text-gray-700">
            The secret number was{" "}
            <span className="font-bold">{gameState.secretNumber}</span>
          </p>
        </div>
      );
    }

    if (gameState.lastResult === "higher") {
      return (
        <div className="text-center py-4">
          <div className="text-5xl mb-2">⬆️</div>
          <p className="text-2xl font-bold text-blue-600">Think Higher!</p>
        </div>
      );
    }

    if (gameState.lastResult === "lower") {
      return (
        <div className="text-center py-4">
          <div className="text-5xl mb-2">⬇️</div>
          <p className="text-2xl font-bold text-orange-600">Think Lower!</p>
        </div>
      );
    }

    return (
      <div className="text-center py-4 text-gray-500">
        <p className="text-lg">Make your first guess!</p>
      </div>
    );
  };

  return (
    <GameShell
      title="Up And Down"
      description={`A configurable number guessing game! Set your own difficulty by choosing the number range and attempts before starting. Default: guess between ${DEFAULT_CONFIG.minNumber} and ${DEFAULT_CONFIG.maxNumber} in ${DEFAULT_CONFIG.maxAttempts} attempts.`}
    >
      {isConfiguring ? (
        <div className="space-y-6">
          <div className="bg-purple-50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-purple-800 mb-4 text-center">
              Configure Your Game
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Customize the difficulty by setting your preferred range and
              number of attempts
            </p>

            <div className="space-y-4">
              {/* Min Number Input */}
              <div>
                <label
                  htmlFor="min-number"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Minimum Number (1 - {SAFE_LIMITS.maxNumber - 1}):
                </label>
                <input
                  id="min-number"
                  type="number"
                  value={minNumberInput}
                  onChange={(e) => {
                    setMinNumberInput(e.target.value);
                    const value = parseInt(e.target.value, 10);
                    if (
                      !isNaN(value) &&
                      value >= 1 &&
                      value < config.maxNumber &&
                      value <= SAFE_LIMITS.maxNumber - 1
                    ) {
                      setConfig({ ...config, minNumber: value });
                    }
                  }}
                  min={1}
                  max={SAFE_LIMITS.maxNumber - 1}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg text-center font-semibold text-black"
                  placeholder="1"
                />
              </div>

              {/* Max Number Input */}
              <div>
                <label
                  htmlFor="max-number"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Maximum Number ({config.minNumber + 1} -{" "}
                  {SAFE_LIMITS.maxNumber}):
                </label>
                <input
                  id="max-number"
                  type="number"
                  value={maxNumberInput}
                  onChange={(e) => {
                    setMaxNumberInput(e.target.value);
                    const value = parseInt(e.target.value, 10);
                    if (
                      !isNaN(value) &&
                      value > config.minNumber &&
                      value <= SAFE_LIMITS.maxNumber
                    ) {
                      setConfig({ ...config, maxNumber: value });
                    }
                  }}
                  min={config.minNumber + 1}
                  max={SAFE_LIMITS.maxNumber}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg text-center font-semibold text-black"
                  placeholder="100"
                />
              </div>

              {/* Max Attempts Input */}
              <div>
                <label
                  htmlFor="max-attempts"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Maximum Attempts (1 - {SAFE_LIMITS.maxAttempts}):
                </label>
                <input
                  id="max-attempts"
                  type="number"
                  value={maxAttemptsInput}
                  onChange={(e) => {
                    setMaxAttemptsInput(e.target.value);
                    const value = parseInt(e.target.value, 10);
                    if (
                      !isNaN(value) &&
                      value >= 1 &&
                      value <= SAFE_LIMITS.maxAttempts
                    ) {
                      setConfig({ ...config, maxAttempts: value });
                    }
                  }}
                  min={1}
                  max={SAFE_LIMITS.maxAttempts}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg text-center font-semibold text-black"
                  placeholder="5"
                />
              </div>
            </div>

            {/* Start Game Button */}
            <button
              onClick={handleStartGame}
              className="w-full mt-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg"
            >
              Start Game
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Game Status */}
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Remaining Attempts</p>
                <p className="text-3xl font-bold text-purple-600">
                  {gameState?.remainingAttempts}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Range</p>
                <p className="text-xl font-semibold text-gray-700">
                  {config.minNumber} - {config.maxNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Message Area */}
          <div className="bg-gray-50 rounded-lg min-h-[150px] flex items-center justify-center">
            {getMessage()}
          </div>

          {/* Input Form */}
          {gameState?.gameStatus === "playing" && (
            <form onSubmit={handleGuess} className="space-y-4">
              <div>
                <label
                  htmlFor="guess-input"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Enter your guess:
                </label>
                <input
                  id="guess-input"
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  min={config.minNumber}
                  max={config.maxNumber}
                  className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg text-center font-semibold text-black"
                  placeholder={`${config.minNumber} - ${config.maxNumber}`}
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg"
              >
                Make Guess
              </button>
            </form>
          )}

          {/* Reset Button */}
          {gameState?.gameStatus !== "playing" && (
            <button
              onClick={handleReset}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
            >
              Play Again
            </button>
          )}

          {/* History */}
          {gameState?.lastGuess !== null && (
            <div className="text-center text-sm text-gray-500">
              <p>
                Last guess:{" "}
                <span className="font-semibold">{gameState?.lastGuess}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </GameShell>
  );
}
