export interface GameState {
  secretNumber: number;
  remainingAttempts: number;
  gameStatus: 'playing' | 'won' | 'lost';
  lastGuess: number | null;
  lastResult: 'higher' | 'lower' | 'correct' | null;
}

export interface GameConfig {
  minNumber: number;
  maxNumber: number;
  maxAttempts: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  minNumber: 1,
  maxNumber: 100,
  maxAttempts: 5,
};

export function generateSecretNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function initializeGame(config: GameConfig = DEFAULT_CONFIG): GameState {
  return {
    secretNumber: generateSecretNumber(config.minNumber, config.maxNumber),
    remainingAttempts: config.maxAttempts,
    gameStatus: 'playing',
    lastGuess: null,
    lastResult: null,
  };
}

export function processGuess(
  state: GameState,
  guess: number,
  config: GameConfig = DEFAULT_CONFIG
): GameState {
  // Validate input
  if (guess < config.minNumber || guess > config.maxNumber) {
    return state; // Invalid guess, don't change state
  }

  if (state.gameStatus !== 'playing') {
    return state; // Game is over
  }

  const newRemainingAttempts = state.remainingAttempts - 1;

  if (guess === state.secretNumber) {
    return {
      ...state,
      lastGuess: guess,
      lastResult: 'correct',
      gameStatus: 'won',
      remainingAttempts: newRemainingAttempts,
    };
  }

  const result = guess < state.secretNumber ? 'higher' : 'lower';
  const gameStatus = newRemainingAttempts === 0 ? 'lost' : 'playing';

  return {
    ...state,
    lastGuess: guess,
    lastResult: result,
    remainingAttempts: newRemainingAttempts,
    gameStatus,
  };
}
