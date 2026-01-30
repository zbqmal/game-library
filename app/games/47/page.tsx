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
  TARGET_TIME,
  FADE_OUT_DURATION,
} from "./gameLogic";

export default function FortySevenPage() {
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
    setGameState(initializeGame());
  };

  const renderContent = () => {
    if (gameState.gameStatus === "initial") {
      return (
        <div className="text-center space-y-6">
          <div className="bg-purple-50 rounded-lg p-8">
            <div className="text-6xl mb-4">⏱️</div>
            <h2 className="text-2xl font-bold text-purple-800 mb-4">
              Ready to Play?
            </h2>
            <p className="text-gray-700 mb-6">
              Stop the timer at exactly {TARGET_TIME} seconds to win!
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

    if (gameState.gameStatus === "stopped" && gameState.finalTime !== null) {
      const difference = calculateDifference(gameState.finalTime);
      const isWin = isExactMatch(gameState.finalTime);

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
