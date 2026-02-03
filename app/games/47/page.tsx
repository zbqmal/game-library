"use client";

import { useState, useEffect, useRef } from "react";
import GameShell from "@/app/components/common/GameShell";
import {
  initializeGame,
  startTimer,
  stopTimer,
  updateTimer,
  calculateDifference,
  formatTime,
  formatDifference,
  isExactMatch,
  GameState,
  Difficulty,
  formatTargetTime,
  FADE_OUT_DURATION,
} from "./gameLogic";

export default function FortySevenPage() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [gameState, setGameState] = useState<GameState>(initializeGame());
  const animationFrameRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Timer update loop
  useEffect(() => {
    if (gameState.gameStatus === "running") {
      const updateLoop = () => {
        setGameState((prevState) => updateTimer(prevState));
        animationFrameRef.current = requestAnimationFrame(updateLoop);
      };

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState.gameStatus]);

  // Timer fade-out effect
  useEffect(() => {
    if (gameState.gameStatus === "running" && gameState.timerVisible) {
      fadeTimeoutRef.current = setTimeout(() => {
        setGameState((prevState) => ({ ...prevState, timerVisible: false }));
      }, FADE_OUT_DURATION);
    }

    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [gameState.gameStatus, gameState.timerVisible]);

  const handleStart = () => {
    setGameState(startTimer(gameState));
  };

  const handleStop = () => {
    setGameState(stopTimer(gameState));
  };

  const handleReset = () => {
    setDifficulty(null);
    setGameState(initializeGame());
  };

  const handleDifficultySelect = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setGameState(initializeGame(selectedDifficulty));
  };

  const renderContent = () => {
    // Show difficulty selection first
    if (difficulty === null) {
      return (
        <div className="text-center space-y-6">
          <div className="bg-purple-50 rounded-lg p-8">
            <div className="text-6xl mb-4">⏱️</div>
            <h2 className="text-2xl font-bold text-purple-800 mb-4">
              Select Difficulty
            </h2>
            <p className="text-gray-700 mb-6">
              Choose your target time:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleDifficultySelect('EASY')}
                className="w-full py-4 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors font-semibold text-lg border-2 border-green-300"
              >
                <div className="text-xl font-bold">EASY</div>
                <div className="text-sm">Target: 0:47</div>
              </button>
              <button
                onClick={() => handleDifficultySelect('MEDIUM')}
                className="w-full py-4 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors font-semibold text-lg border-2 border-yellow-300"
              >
                <div className="text-xl font-bold">MEDIUM</div>
                <div className="text-sm">Target: 1:47</div>
              </button>
              <button
                onClick={() => handleDifficultySelect('HARD')}
                className="w-full py-4 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-semibold text-lg border-2 border-red-300"
              >
                <div className="text-xl font-bold">HARD</div>
                <div className="text-sm">Target: 2:47</div>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (gameState.gameStatus === "initial" && difficulty !== null) {
      return (
        <div className="text-center space-y-6">
          <div className="bg-purple-50 rounded-lg p-8">
            <div className="text-6xl mb-4">⏱️</div>
            <h2 className="text-2xl font-bold text-purple-800 mb-4">
              Ready to Play?
            </h2>
            <div className="mb-4 p-3 bg-purple-100 rounded-lg">
              <p className="text-sm text-purple-700 font-semibold">
                Difficulty: {difficulty}
              </p>
              <p className="text-lg font-bold text-purple-900">
                Target: {formatTargetTime(difficulty)}
              </p>
            </div>
            <p className="text-gray-700 mb-6">
              Stop the timer at exactly {formatTargetTime(difficulty)} to win!
            </p>
            <p className="text-sm text-gray-600 mb-6">
              The timer will fade out after 3 seconds, so you&apos;ll need to
              rely on your internal sense of time.
            </p>
            <button
              onClick={handleStart}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg"
            >
              Start Timer
            </button>
          </div>
        </div>
      );
    }

    if (gameState.gameStatus === "running") {
      return (
        <div className="text-center space-y-6">
          {/* Timer Display with fade-out */}
          <div
            className={`bg-purple-50 rounded-lg p-8 transition-opacity ${
              gameState.timerVisible ? "opacity-100" : "opacity-0"
            }`}
            style={{
              transitionDuration: "3000ms",
            }}
          >
            <div className="text-7xl font-bold text-purple-600 mb-2">
              {formatTime(gameState.currentTime)}s
            </div>
            <p className="text-gray-600">Timer running...</p>
          </div>

          {/* Stop Button */}
          <button
            onClick={handleStop}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg"
          >
            Stop Timer
          </button>
        </div>
      );
    }

    if (gameState.gameStatus === "stopped" && gameState.finalTime !== null && difficulty !== null) {
      const difference = calculateDifference(gameState.finalTime, difficulty);
      const isWin = isExactMatch(gameState.finalTime, difficulty);

      return (
        <div className="text-center space-y-6">
          <div className="bg-purple-50 rounded-lg p-8">
            {isWin ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-600 mb-4">
                  Perfect!
                </h2>
                <p className="text-xl text-gray-700 mb-2">
                  You stopped at exactly {formatTime(gameState.finalTime)}
                  seconds!
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">⏱️</div>
                <h2 className="text-3xl font-bold text-purple-800 mb-4">
                  Your Result
                </h2>
                <p className="text-xl text-gray-700 mb-2">
                  You stopped at {formatTime(gameState.finalTime)} seconds
                </p>
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <p className="text-gray-600 mb-2">Difference from target:</p>
                  <p
                    className={`text-3xl font-bold ${
                      difference > 0 ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {formatDifference(difference)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {difference > 0
                      ? "(stopped late)"
                      : difference < 0
                        ? "(stopped early)"
                        : ""}
                  </p>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleReset}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
          >
            Play Again
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <GameShell
      title="47"
      description="A timing challenge! Stop the timer at exactly 47.0 seconds. The timer will fade out after 3 seconds—trust your instincts!"
    >
      {renderContent()}
    </GameShell>
  );
}
