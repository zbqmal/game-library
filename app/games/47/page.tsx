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
import { useGameLibraryTranslations } from "@/app/translation-engine";
import { interpolate } from "@/app/lib/utils";

export default function FortySevenPage() {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [gameState, setGameState] = useState<GameState>(initializeGame());
  const animationFrameRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { texts } = useGameLibraryTranslations();

  const difficultyLabels: Record<Difficulty, string> = {
    EASY: texts.game47DifficultyEasy,
    MEDIUM: texts.game47DifficultyMedium,
    HARD: texts.game47DifficultyHard,
  };

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
              {texts.game47SelectDifficultyTitle}
            </h2>
            <p className="text-gray-700 mb-6">
              {texts.game47SelectDifficultySubtitle}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => handleDifficultySelect("EASY")}
                className="w-full py-4 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors font-semibold text-lg border-2 border-green-300"
              >
                <div className="text-xl font-bold">
                  {texts.game47DifficultyEasy}
                </div>
                <div className="text-sm">
                  {interpolate(texts.game47TargetLabel, {
                    time: "0:47",
                  })}
                </div>
              </button>
              <button
                onClick={() => handleDifficultySelect("MEDIUM")}
                className="w-full py-4 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors font-semibold text-lg border-2 border-yellow-300"
              >
                <div className="text-xl font-bold">
                  {texts.game47DifficultyMedium}
                </div>
                <div className="text-sm">
                  {interpolate(texts.game47TargetLabel, {
                    time: "1:47",
                  })}
                </div>
              </button>
              <button
                onClick={() => handleDifficultySelect("HARD")}
                className="w-full py-4 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-semibold text-lg border-2 border-red-300"
              >
                <div className="text-xl font-bold">
                  {texts.game47DifficultyHard}
                </div>
                <div className="text-sm">
                  {interpolate(texts.game47TargetLabel, {
                    time: "2:47",
                  })}
                </div>
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
              {texts.game47ReadyTitle}
            </h2>
            <div className="mb-4 p-3 bg-purple-100 rounded-lg">
              <p className="text-sm text-purple-700 font-semibold">
                {interpolate(texts.game47DifficultyLabel, {
                  difficulty: difficultyLabels[difficulty],
                })}
              </p>
              <p className="text-lg font-bold text-purple-900">
                {interpolate(texts.game47TargetLabel, {
                  time: formatTargetTime(difficulty),
                })}
              </p>
            </div>
            <p className="text-gray-700 mb-6">
              {interpolate(texts.game47StopAtExact, {
                time: formatTargetTime(difficulty),
              })}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {texts.game47FadeOutHint}
            </p>
            <button
              onClick={handleStart}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg"
            >
              {texts.game47StartTimer}
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
            <p className="text-gray-600">{texts.game47TimerRunning}</p>
          </div>

          {/* Stop Button */}
          <button
            onClick={handleStop}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg"
          >
            {texts.game47StopTimer}
          </button>
        </div>
      );
    }

    if (
      gameState.gameStatus === "stopped" &&
      gameState.finalTime !== null &&
      difficulty !== null
    ) {
      const difference = calculateDifference(gameState.finalTime, difficulty);
      const isWin = isExactMatch(gameState.finalTime, difficulty);

      return (
        <div className="text-center space-y-6">
          <div className="bg-purple-50 rounded-lg p-8">
            {isWin ? (
              <>
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-green-600 mb-4">
                  {texts.game47PerfectTitle}
                </h2>
                <p className="text-xl text-gray-700 mb-2">
                  {interpolate(texts.game47PerfectMessage, {
                    time: formatTime(gameState.finalTime),
                  })}
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">⏱️</div>
                <h2 className="text-3xl font-bold text-purple-800 mb-4">
                  {texts.game47ResultTitle}
                </h2>
                <p className="text-xl text-gray-700 mb-2">
                  {interpolate(texts.game47StoppedAtMessage, {
                    time: formatTime(gameState.finalTime),
                  })}
                </p>
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <p className="text-gray-600 mb-2">
                    {texts.game47DifferenceLabel}
                  </p>
                  <p
                    className={`text-3xl font-bold ${
                      difference > 0 ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {formatDifference(difference)}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {difference > 0
                      ? texts.game47StoppedLate
                      : difference < 0
                        ? texts.game47StoppedEarly
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
            {texts.actionPlayAgain}
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <GameShell
      title={texts.game47Title}
      description={texts.game47PageDescription}
    >
      {renderContent()}
    </GameShell>
  );
}
