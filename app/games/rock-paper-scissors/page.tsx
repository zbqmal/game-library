"use client";

import { useState } from "react";
import GameShell from "@/app/components/GameShell";
import Scoreboard from "@/app/components/Scoreboard";
import NameInputModal from "@/app/components/NameInputModal";
import Countdown from "@/app/components/Countdown";
import { initializeGame, processRound, GameState, Choice } from "./gameLogic";
import { scoreboardAdapter } from "@/app/lib/scoreboard";

const GAME_ID = "rock-paper-scissors";

export default function RockPaperScissorsPage() {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownKey, setCountdownKey] = useState(0);
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);

  const handleChoice = (choice: Choice) => {
    setPendingChoice(choice);
    setCountdownKey((prev) => prev + 1);
    setShowCountdown(true);
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    if (pendingChoice) {
      const newState = processRound(gameState, pendingChoice);
      setGameState(newState);
      setPendingChoice(null);

      // Check if game is over and score qualifies for top 10
      if (newState.isGameOver && newState.finalScore > 0) {
        const isTop10 = scoreboardAdapter.isTopScore(
          GAME_ID,
          newState.finalScore,
        );
        if (isTop10) {
          setShowNameModal(true);
        }
      }
    }
  };

  const handleSaveScore = (name: string) => {
    scoreboardAdapter.saveScore(GAME_ID, {
      name,
      score: gameState.finalScore,
    });

    // Dispatch custom event to update scoreboard
    window.dispatchEvent(
      new CustomEvent("scoreboardUpdated", { detail: { gameId: GAME_ID } }),
    );

    setShowNameModal(false);
  };

  const handleReset = () => {
    setGameState(initializeGame());
    setShowNameModal(false);
  };

  const getChoiceEmoji = (choice: Choice | null) => {
    if (!choice) return "❓";
    const emojis: Record<Choice, string> = {
      rock: "✊",
      paper: "✋",
      scissors: "✌️",
    };
    return emojis[choice];
  };

  const getOutcomeMessage = () => {
    if (!gameState.outcome) return null;

    if (gameState.outcome === "win") {
      return (
        <div className="text-center py-4">
          <div className="text-5xl mb-2">🎉</div>
          <p className="text-2xl font-bold text-green-600">You Win!</p>
        </div>
      );
    }

    if (gameState.outcome === "lose") {
      return (
        <div className="text-center py-4">
          <div className="text-5xl mb-2">😢</div>
          <p className="text-2xl font-bold text-red-600">You Lose!</p>
          <p className="text-lg text-gray-900 mt-2">
            Final Score: {gameState.finalScore} consecutive wins
          </p>
        </div>
      );
    }

    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-2">🤝</div>
        <p className="text-2xl font-bold text-blue-600">Draw!</p>
      </div>
    );
  };

  return (
    <GameShell
      title="Rock-Paper-Scissors"
      description="Play against the computer and get as many consecutive wins as possible!"
      scoreboard={<Scoreboard gameId={GAME_ID} />}
    >
      <div className="relative space-y-6 min-h-[600px]">
        {/* Score Display */}
        <div className="bg-purple-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-900 font-medium">Consecutive Wins</p>
          <p className="text-4xl font-bold text-purple-600">
            {gameState.consecutiveWins}
          </p>
        </div>

        {/* Result Area */}
        {gameState.playerChoice && gameState.computerChoice && (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-3 gap-4 items-center mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-900 font-medium mb-2">You</p>
                <div className="text-6xl">
                  {getChoiceEmoji(gameState.playerChoice)}
                </div>
                <p className="text-lg font-semibold capitalize mt-2">
                  {gameState.playerChoice}
                </p>
              </div>
              <div className="text-center text-4xl">VS</div>
              <div className="text-center">
                <p className="text-sm text-gray-900 font-medium mb-2">Computer</p>
                <div className="text-6xl">
                  {getChoiceEmoji(gameState.computerChoice)}
                </div>
                <p className="text-lg font-semibold capitalize mt-2">
                  {gameState.computerChoice}
                </p>
              </div>
            </div>
            {getOutcomeMessage()}
          </div>
        )}

        {/* Choice Buttons */}
        {!gameState.isGameOver && !showCountdown && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 text-center">
              {gameState.playerChoice
                ? "Make your next choice:"
                : "Choose your move:"}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {(["rock", "paper", "scissors"] as Choice[]).map((choice) => (
                <button
                  key={choice}
                  onClick={() => handleChoice(choice)}
                  className="flex flex-col items-center justify-center p-6 bg-white border-4 border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all transform hover:scale-105 active:scale-95"
                >
                  <div className="text-6xl mb-2">{getChoiceEmoji(choice)}</div>
                  <p className="text-lg font-semibold capitalize">{choice}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Play Again Button */}
        {gameState.isGameOver && (
          <button
            onClick={handleReset}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
          >
            Play Again
          </button>
        )}

        {/* Overlays - rendered as children within the game container */}
        <Countdown
          key={countdownKey}
          start={3}
          show={showCountdown}
          onComplete={handleCountdownComplete}
        />

        <NameInputModal
          visible={showNameModal}
          score={gameState.finalScore}
          onSave={handleSaveScore}
          onClose={() => setShowNameModal(false)}
        />
      </div>
    </GameShell>
  );
}
