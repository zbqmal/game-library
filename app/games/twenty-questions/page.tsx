"use client";

import { useState } from "react";
import GameShell from "@/app/components/common/GameShell";
import {
  initializeGame,
  setAction,
  processQuestion,
  processGuess,
  GameState,
  ActionType,
} from "./gameLogic";

export default function TwentyQuestionsPage() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [inputValue, setInputValue] = useState("");

  const handleStartGame = () => {
    setGameState(initializeGame());
  };

  const handleActionSelect = (action: ActionType) => {
    if (!gameState) return;
    setGameState(setAction(gameState, action));
    setInputValue("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameState || !inputValue.trim()) return;

    if (gameState.currentAction === 'question') {
      const newState = processQuestion(gameState, inputValue);
      setGameState(newState);
    } else if (gameState.currentAction === 'guess') {
      const newState = processGuess(gameState, inputValue);
      setGameState(newState);
    }
    
    setInputValue("");
  };

  const handleFinalGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameState || !inputValue.trim()) return;
    
    const newState = processGuess(gameState, inputValue);
    setGameState(newState);
    setInputValue("");
  };

  const handleReset = () => {
    setGameState(null);
    setInputValue("");
  };

  const getInstructionText = () => {
    if (!gameState) return null;
    
    if (gameState.currentAction === 'question') {
      return "Enter a yes/no question:";
    } else if (gameState.currentAction === 'guess') {
      return "Enter your guess:";
    }
    return "Choose an action:";
  };

  return (
    <GameShell
      title="Twenty Questions"
      description="I'm thinking of a noun. You have 20 attempts to figure it out by asking yes/no questions or making direct guesses. Can you guess what it is?"
    >
      {!gameState ? (
        <div className="space-y-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-blue-800 mb-4 text-center">
              How to Play
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                <strong>Goal:</strong> Guess the secret noun I&apos;m thinking of!
              </p>
              <p>
                <strong>Rules:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You have 20 total attempts</li>
                <li>Each turn, choose to either ask a question or make a guess</li>
                <li>
                  <strong>Question:</strong> Must be answerable with &quot;Yes&quot; or &quot;No&quot;
                  (e.g., &quot;Is it alive?&quot;, &quot;Is it bigger than a car?&quot;)
                </li>
                <li>
                  <strong>Guess:</strong> Name what you think the answer is
                  (e.g., &quot;elephant&quot;, &quot;pizza&quot;)
                </li>
                <li>Invalid questions still count as attempts</li>
                <li>After using all 20 attempts, you get one final guess</li>
              </ul>
            </div>
          </div>

          <button
            onClick={handleStartGame}
            className="w-full py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Game Status */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">
                  {gameState.gameStatus === 'finalGuess' ? 'Final Guess!' : 'Remaining Attempts'}
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {gameState.gameStatus === 'finalGuess' ? '1' : gameState.remainingAttempts}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-xl font-semibold text-gray-700">
                  {gameState.actionHistory.length} / 20
                </p>
              </div>
            </div>
          </div>

          {/* Game Over Messages */}
          {gameState.gameStatus === 'won' && (
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-3xl font-bold text-green-600 mb-2">
                Congratulations!
              </h2>
              <p className="text-xl text-gray-700">
                You guessed it! The answer was{" "}
                <span className="font-bold">{gameState.secretAnswer}</span>!
              </p>
              <p className="text-md text-gray-600 mt-2">
                You used {gameState.actionHistory.length} attempt(s).
              </p>
            </div>
          )}

          {gameState.gameStatus === 'lost' && (
            <div className="bg-red-50 rounded-lg p-6 text-center">
              <div className="text-6xl mb-4">😢</div>
              <h2 className="text-3xl font-bold text-red-600 mb-2">Game Over!</h2>
              <p className="text-xl text-gray-700">
                The answer was{" "}
                <span className="font-bold">{gameState.secretAnswer}</span>
              </p>
              <p className="text-md text-gray-600 mt-2">
                Better luck next time!
              </p>
            </div>
          )}

          {/* Final Guess Phase */}
          {gameState.gameStatus === 'finalGuess' && (
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-xl font-bold text-yellow-800 mb-2 text-center">
                Final Guess Phase!
              </h3>
              <p className="text-center text-gray-700">
                You've used all 20 attempts. Make one final guess!
              </p>
              <form onSubmit={handleFinalGuess} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="final-guess-input"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Enter your final guess:
                  </label>
                  <input
                    id="final-guess-input"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg focus:outline-none focus:border-yellow-500 text-lg text-center font-semibold text-black"
                    placeholder="What is it?"
                    autoFocus
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold text-lg"
                >
                  Submit Final Guess
                </button>
              </form>
            </div>
          )}

          {/* Action Selection and Input */}
          {gameState.gameStatus === 'playing' && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3 text-center">
                  {getInstructionText()}
                </p>

                {!gameState.currentAction ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleActionSelect('question')}
                      className="py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg"
                    >
                      Ask Question
                    </button>
                    <button
                      onClick={() => handleActionSelect('guess')}
                      className="py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                    >
                      Make Guess
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <input
                        id="action-input"
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg text-center font-semibold text-black"
                        placeholder={
                          gameState.currentAction === 'question'
                            ? "e.g., Is it alive?"
                            : "e.g., elephant"
                        }
                        autoFocus
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setGameState({ ...gameState, currentAction: null });
                          setInputValue("");
                        }}
                        className="py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={`py-3 text-white rounded-lg transition-colors font-semibold ${
                          gameState.currentAction === 'question'
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        Submit
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Action History */}
          {gameState.actionHistory.length > 0 && (
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
              <h3 className="text-lg font-bold text-gray-800 mb-3">History</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {gameState.actionHistory.slice().reverse().map((item, index) => (
                  <div
                    key={gameState.actionHistory.length - index}
                    className={`p-3 rounded-lg ${
                      item.type === 'question'
                        ? 'bg-purple-50 border-l-4 border-purple-500'
                        : 'bg-green-50 border-l-4 border-green-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-500">
                            #{item.attemptNumber}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              item.type === 'question'
                                ? 'bg-purple-200 text-purple-800'
                                : 'bg-green-200 text-green-800'
                            }`}
                          >
                            {item.type === 'question' ? 'Question' : 'Guess'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>You:</strong> {item.input}
                        </p>
                        <p
                          className={`text-sm font-semibold ${
                            item.response === 'Invalid question'
                              ? 'text-red-600'
                              : item.response === 'Correct!'
                                ? 'text-green-600'
                                : item.response === 'Incorrect'
                                  ? 'text-red-600'
                                  : 'text-blue-600'
                          }`}
                        >
                          <strong>AI:</strong> {item.response}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset Button */}
          {(gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') && (
            <button
              onClick={handleReset}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
            >
              Play Again
            </button>
          )}
        </div>
      )}
    </GameShell>
  );
}
