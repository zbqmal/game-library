export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface GameState {
  startTime: number | null;
  currentTime: number;
  gameStatus: 'initial' | 'running' | 'stopped';
  finalTime: number | null;
  timerVisible: boolean;
  difficulty: Difficulty | null;
}

export const TARGET_TIME = 47.0; // Default for backward compatibility
export const FADE_OUT_DURATION = 3000; // 3 seconds in milliseconds

export function getTargetTime(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'EASY':
      return 47.0;
    case 'MEDIUM':
      return 107.0; // 1:47
    case 'HARD':
      return 167.0; // 2:47
  }
}

export function formatTargetTime(difficulty: Difficulty): string {
  const seconds = getTargetTime(difficulty);
  if (seconds < 60) {
    return `0:${seconds.toFixed(0).padStart(2, '0')}`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toFixed(0).padStart(2, '0')}`;
}

export function initializeGame(difficulty: Difficulty | null = null): GameState {
  return {
    startTime: null,
    currentTime: 0,
    gameStatus: 'initial',
    finalTime: null,
    timerVisible: true,
    difficulty,
  };
}

export function startTimer(state: GameState): GameState {
  if (state.gameStatus !== 'initial') {
    return state;
  }

  return {
    ...state,
    startTime: Date.now(),
    currentTime: 0,
    gameStatus: 'running',
    timerVisible: true,
  };
}

export function updateTimer(state: GameState): GameState {
  if (state.gameStatus !== 'running' || state.startTime === null) {
    return state;
  }

  const elapsed = (Date.now() - state.startTime) / 1000; // Convert to seconds

  return {
    ...state,
    currentTime: elapsed,
  };
}

export function stopTimer(state: GameState): GameState {
  if (state.gameStatus !== 'running') {
    return state;
  }

  return {
    ...state,
    gameStatus: 'stopped',
    finalTime: state.currentTime,
  };
}

export function calculateDifference(finalTime: number, difficulty: Difficulty): number {
  return finalTime - getTargetTime(difficulty);
}

export function formatTime(seconds: number): string {
  return seconds.toFixed(2);
}

export function formatDifference(difference: number): string {
  const sign = difference >= 0 ? '+' : '';
  return `${sign}${difference.toFixed(2)}s`;
}

export function isExactMatch(finalTime: number, difficulty: Difficulty): boolean {
  // Check if the time is exactly at target (within floating point precision)
  return Math.abs(finalTime - getTargetTime(difficulty)) < 0.01;
}
