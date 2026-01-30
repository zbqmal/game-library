export interface GameState {
  startTime: number | null;
  currentTime: number;
  gameStatus: 'initial' | 'running' | 'stopped';
  finalTime: number | null;
  timerVisible: boolean;
}

export const TARGET_TIME = 47.0;
export const FADE_OUT_DURATION = 3000; // 3 seconds in milliseconds

export function initializeGame(): GameState {
  return {
    startTime: null,
    currentTime: 0,
    gameStatus: 'initial',
    finalTime: null,
    timerVisible: true,
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

export function calculateDifference(finalTime: number): number {
  return finalTime - TARGET_TIME;
}

export function formatTime(seconds: number): string {
  return seconds.toFixed(2);
}

export function formatDifference(difference: number): string {
  const sign = difference >= 0 ? '+' : '';
  return `${sign}${difference.toFixed(2)}s`;
}

export function isExactMatch(finalTime: number): boolean {
  // Check if the time is exactly 47.0 seconds (within floating point precision)
  return Math.abs(finalTime - TARGET_TIME) < 0.01;
}
