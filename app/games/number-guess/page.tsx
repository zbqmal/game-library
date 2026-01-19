'use client';

import { useState } from 'react';
import GameShell from '@/app/components/GameShell';
import { initializeGame, processGuess, GameState, DEFAULT_CONFIG } from './gameLogic';

export default function NumberGuessPage() {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());
  const [inputValue, setInputValue] = useState('');

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    const guess = parseInt(inputValue, 10);

    if (isNaN(guess)) {
      return;
    }

    const newState = processGuess(gameState, guess, DEFAULT_CONFIG);
    setGameState(newState);
    setInputValue('');
  };

  const handleReset = () => {
    setGameState(initializeGame());
    setInputValue('');
  };

  const getMessage = () => {
    if (gameState.gameStatus === 'won') {
      return (
        <div className="text-center py-6">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-green-600 mb-2">Congratulations!</h2>
          <p className="text-xl text-gray-700">
            You guessed the number <span className="font-bold">{gameState.secretNumber}</span>!
          </p>
        </div>
      );
    }

    if (gameState.gameStatus === 'lost') {
      return (
        <div className="text-center py-6">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-3xl font-bold text-red-600 mb-2">Game Over!</h2>
          <p className="text-xl text-gray-700">
            The secret number was <span className="font-bold">{gameState.secretNumber}</span>
          </p>
        </div>
      );
    }

    if (gameState.lastResult === 'higher') {
      return (
        <div className="text-center py-4">
          <div className="text-5xl mb-2">⬆️</div>
          <p className="text-2xl font-bold text-blue-600">Think Higher!</p>
        </div>
      );
    }

    if (gameState.lastResult === 'lower') {
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
      title="Number Guessing Game"
      description={`Guess the secret number between ${DEFAULT_CONFIG.minNumber} and ${DEFAULT_CONFIG.maxNumber}. You have ${DEFAULT_CONFIG.maxAttempts} attempts!`}
    >
      <div className="space-y-6">
        {/* Game Status */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Remaining Attempts</p>
              <p className="text-3xl font-bold text-purple-600">{gameState.remainingAttempts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Range</p>
              <p className="text-xl font-semibold text-gray-700">
                {DEFAULT_CONFIG.minNumber} - {DEFAULT_CONFIG.maxNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Message Area */}
        <div className="bg-gray-50 rounded-lg min-h-[150px] flex items-center justify-center">
          {getMessage()}
        </div>

        {/* Input Form */}
        {gameState.gameStatus === 'playing' && (
          <form onSubmit={handleGuess} className="space-y-4">
            <div>
              <label htmlFor="guess-input" className="block text-sm font-semibold text-gray-700 mb-2">
                Enter your guess:
              </label>
              <input
                id="guess-input"
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                min={DEFAULT_CONFIG.minNumber}
                max={DEFAULT_CONFIG.maxNumber}
                className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500 text-lg text-center font-semibold"
                placeholder={`${DEFAULT_CONFIG.minNumber} - ${DEFAULT_CONFIG.maxNumber}`}
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
        {gameState.gameStatus !== 'playing' && (
          <button
            onClick={handleReset}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
          >
            Play Again
          </button>
        )}

        {/* History */}
        {gameState.lastGuess !== null && (
          <div className="text-center text-sm text-gray-500">
            <p>Last guess: <span className="font-semibold">{gameState.lastGuess}</span></p>
          </div>
        )}
      </div>
    </GameShell>
  );
}
