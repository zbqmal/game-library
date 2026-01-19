'use client';

import { useState } from 'react';
import GameShell from '@/app/components/GameShell';
import Scoreboard from '@/app/components/Scoreboard';
import NameInputModal from '@/app/components/NameInputModal';
import {
  initializeGame,
  rollDice,
  processDiceRoll,
  launchMiniGame,
  processMiniGameResult,
  continueGame,
  shouldRecordScore,
  StairsGameState,
  MiniGameType,
} from './gameLogic';
import { scoreboardAdapter } from '@/app/lib/scoreboard';

const GAME_ID = 'stairs';

export default function StairsPage() {
  const [gameState, setGameState] = useState<StairsGameState>(() => initializeGame());
  const [showNameModal, setShowNameModal] = useState(false);
  const [isRolling, setIsRolling] = useState(false);

  const handleRollDice = () => {
    if (gameState.miniGameActive || gameState.isGameOver || gameState.isAtTop || isRolling) {
      return;
    }

    setIsRolling(true);
    
    // Animate dice roll
    setTimeout(() => {
      const diceValue = rollDice();
      const newState = processDiceRoll(gameState, diceValue);
      setGameState(newState);
      setIsRolling(false);
    }, 500);
  };

  const handleLaunchMiniGame = () => {
    const newState = launchMiniGame(gameState);
    setGameState(newState);
  };

  const handleMiniGameComplete = (result: 'win' | 'lose') => {
    const newState = processMiniGameResult(gameState, result);
    setGameState(newState);

    // Check if score qualifies for top 10
    if (newState.isGameOver && shouldRecordScore(newState)) {
      const isTop10 = scoreboardAdapter.isTopScore(GAME_ID, newState.finalScore);
      if (isTop10) {
        setShowNameModal(true);
      }
    }
  };

  const handleSaveScore = (name: string) => {
    scoreboardAdapter.saveScore(GAME_ID, {
      name,
      score: gameState.finalScore,
    });
    
    // Dispatch custom event to update scoreboard
    window.dispatchEvent(new CustomEvent('scoreboardUpdated', { detail: { gameId: GAME_ID } }));
    
    setShowNameModal(false);
  };

  const handleContinuePlaying = () => {
    const newState = continueGame(gameState);
    setGameState(newState);
  };

  const handleReset = () => {
    setGameState(initializeGame());
    setShowNameModal(false);
  };

  const getDiceDisplay = () => {
    if (isRolling) {
      return '🎲';
    }
    if (gameState.lastDiceRoll) {
      const diceFaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
      return diceFaces[gameState.lastDiceRoll - 1];
    }
    return '🎲';
  };

  const getMiniGameName = (type: MiniGameType | null): string => {
    if (!type) return '';
    const names: Record<MiniGameType, string> = {
      'rps': 'Rock-Paper-Scissors',
      'treasure-hunt': 'Treasure Hunt',
      'paroma': 'Paroma',
      'swimming-race': 'Swimming Race',
    };
    return names[type];
  };

  return (
    <GameShell
      title="Stairs"
      description="Roll the dice, climb stairs, and win mini-games to achieve the highest score!"
      scoreboard={<Scoreboard gameId={GAME_ID} />}
    >
      <div className="relative space-y-6">
        {/* Stats Display */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Current Stairs</p>
            <p className="text-3xl font-bold text-blue-600">{gameState.currentStairCount}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Games Won</p>
            <p className="text-3xl font-bold text-green-600">{gameState.gamesWon}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">High Score</p>
            <p className="text-3xl font-bold text-purple-600">{gameState.highestStairCount}</p>
          </div>
        </div>

        {/* Stairs Visualization */}
        <div className="bg-gradient-to-b from-blue-100 to-blue-50 rounded-lg p-6 min-h-[200px] flex flex-col justify-end items-center">
          <div className="text-center mb-4">
            <p className="text-lg font-semibold text-gray-700">
              {gameState.isAtTop ? '🚪 You reached the top!' : `🧗 Stair ${gameState.currentStairCount}`}
            </p>
          </div>
          
          {/* Visual stairs */}
          <div className="flex flex-col-reverse items-center space-y-reverse space-y-1">
            {Array.from({ length: Math.min(gameState.currentStairCount, 10) }, (_, i) => (
              <div 
                key={i} 
                className="bg-amber-600 rounded px-8 py-2 shadow-md"
                style={{ width: `${80 + i * 10}px` }}
              />
            ))}
          </div>
        </div>

        {/* Dice Roll Section */}
        {!gameState.isAtTop && !gameState.miniGameActive && !gameState.isGameOver && (
          <div className="text-center">
            <div className="text-8xl mb-4 animate-pulse">
              {getDiceDisplay()}
            </div>
            <button
              onClick={handleRollDice}
              disabled={isRolling}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-semibold text-xl"
            >
              {isRolling ? 'Rolling...' : 'Roll Dice'}
            </button>
            {gameState.lastDiceRoll && (
              <p className="mt-4 text-lg text-gray-600">
                You rolled a {gameState.lastDiceRoll}! Climbed to stair {gameState.currentStairCount}
              </p>
            )}
          </div>
        )}

        {/* Game Start Button */}
        {gameState.isAtTop && gameState.canLaunchMiniGame && !gameState.miniGameActive && (
          <div className="text-center">
            <div className="text-6xl mb-4">🎮</div>
            <button
              onClick={handleLaunchMiniGame}
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-xl animate-pulse"
            >
              GAME START
            </button>
            <p className="mt-4 text-lg text-gray-600">
              You&apos;re at the top! Launch a mini-game to record your score.
            </p>
          </div>
        )}

        {/* Mini-Game Section */}
        {gameState.miniGameActive && gameState.miniGameType && (
          <div className="bg-white border-4 border-purple-300 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-center mb-4">
              Mini-Game: {getMiniGameName(gameState.miniGameType)}
            </h3>
            
            {/* Simple RPS implementation for demo */}
            {gameState.miniGameType === 'rps' && (
              <SimpleMiniGame onComplete={handleMiniGameComplete} />
            )}
            
            {/* Placeholder for other games */}
            {gameState.miniGameType !== 'rps' && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  {getMiniGameName(gameState.miniGameType)} mini-game will be implemented soon!
                </p>
                <div className="space-x-4">
                  <button
                    onClick={() => handleMiniGameComplete('win')}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Win (Demo)
                  </button>
                  <button
                    onClick={() => handleMiniGameComplete('lose')}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Lose (Demo)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Continue or Game Over */}
        {!gameState.miniGameActive && gameState.miniGameResult && !gameState.isGameOver && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-2xl font-bold text-green-600 mb-4">You Won!</p>
            <p className="text-lg text-gray-600 mb-6">
              Score recorded: {gameState.currentStairCount} stairs
            </p>
            <button
              onClick={handleContinuePlaying}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-xl"
            >
              Continue Climbing
            </button>
          </div>
        )}

        {/* Game Over */}
        {gameState.isGameOver && (
          <div className="text-center">
            <div className="text-5xl mb-4">
              {gameState.finalScore > 0 ? '🏆' : '😢'}
            </div>
            <p className="text-2xl font-bold mb-4">
              {gameState.finalScore > 0 ? 'Game Over!' : 'Game Over - Better luck next time!'}
            </p>
            <p className="text-xl text-gray-700 mb-6">
              Final Score: <span className="font-bold text-purple-600">{gameState.finalScore}</span> stairs
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Games Played: {gameState.gamesPlayed} | Games Won: {gameState.gamesWon}
            </p>
            <button
              onClick={handleReset}
              className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-xl"
            >
              Play Again
            </button>
          </div>
        )}

        {/* Name Input Modal */}
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

/**
 * Simple mini-game component for Rock-Paper-Scissors
 */
function SimpleMiniGame({ onComplete }: { onComplete: (result: 'win' | 'lose') => void }) {
  const [playerChoice, setPlayerChoice] = useState<string | null>(null);
  const [computerChoice, setComputerChoice] = useState<string | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);

  const choices = ['rock', 'paper', 'scissors'];
  const emojis: Record<string, string> = {
    rock: '✊',
    paper: '✋',
    scissors: '✌️',
  };

  const handleChoice = (choice: string) => {
    // eslint-disable-next-line react-hooks/purity
    const computerPick = choices[Math.floor(Math.random() * 3)];
    setPlayerChoice(choice);
    setComputerChoice(computerPick);

    // Determine winner
    let gameResult: 'win' | 'lose' | 'draw';
    if (choice === computerPick) {
      gameResult = 'draw';
    } else if (
      (choice === 'rock' && computerPick === 'scissors') ||
      (choice === 'paper' && computerPick === 'rock') ||
      (choice === 'scissors' && computerPick === 'paper')
    ) {
      gameResult = 'win';
    } else {
      gameResult = 'lose';
    }

    setResult(gameResult);

    // Auto-complete after showing result
    if (gameResult !== 'draw') {
      setTimeout(() => {
        onComplete(gameResult);
      }, 2000);
    }
  };

  const handleRetry = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  };

  if (result) {
    return (
      <div className="text-center py-6">
        <div className="grid grid-cols-3 gap-4 items-center mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">You</p>
            <div className="text-6xl">{playerChoice && emojis[playerChoice]}</div>
            <p className="text-lg capitalize mt-2">{playerChoice}</p>
          </div>
          <div className="text-3xl font-bold">VS</div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Computer</p>
            <div className="text-6xl">{computerChoice && emojis[computerChoice]}</div>
            <p className="text-lg capitalize mt-2">{computerChoice}</p>
          </div>
        </div>
        
        {result === 'win' && (
          <div>
            <div className="text-5xl mb-2">🎉</div>
            <p className="text-2xl font-bold text-green-600">You Win!</p>
            <p className="text-sm text-gray-600 mt-2">Completing mini-game...</p>
          </div>
        )}
        
        {result === 'lose' && (
          <div>
            <div className="text-5xl mb-2">😢</div>
            <p className="text-2xl font-bold text-red-600">You Lose!</p>
            <p className="text-sm text-gray-600 mt-2">Ending game...</p>
          </div>
        )}
        
        {result === 'draw' && (
          <div>
            <div className="text-5xl mb-2">🤝</div>
            <p className="text-2xl font-bold text-blue-600">Draw!</p>
            <button
              onClick={handleRetry}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center py-6">
      <p className="text-lg font-semibold mb-6">Choose your move:</p>
      <div className="grid grid-cols-3 gap-4">
        {choices.map((choice) => (
          <button
            key={choice}
            onClick={() => handleChoice(choice)}
            className="flex flex-col items-center justify-center p-6 bg-white border-4 border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all transform hover:scale-105 active:scale-95"
          >
            <div className="text-6xl mb-2">{emojis[choice]}</div>
            <p className="text-lg font-semibold capitalize">{choice}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
