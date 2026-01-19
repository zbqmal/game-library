/**
 * STAIRS Game Logic
 * 
 * Port from the original GBA C implementation at https://github.com/zbqmal/STAIRS
 * 
 * Game Rules:
 * - Player rolls a dice (1-6) and climbs that many stairs
 * - When reaching the top (stair 5+), player can launch a mini-game
 * - If player wins the mini-game, the current stair count becomes the score
 * - If player loses the FIRST mini-game, final score is 0
 * - If player loses after winning at least once, the previous high score is kept
 * - Player can continue climbing after winning a mini-game
 */

export type MiniGameType = 'rps' | 'treasure-hunt' | 'paroma' | 'swimming-race';
export type MiniGameResult = 'win' | 'lose' | null;

export interface StairsGameState {
  currentStairCount: number;
  isAtTop: boolean;
  canLaunchMiniGame: boolean;
  miniGameActive: boolean;
  miniGameType: MiniGameType | null;
  miniGameResult: MiniGameResult;
  gamesPlayed: number;
  gamesWon: number;
  highestStairCount: number;
  finalScore: number;
  isGameOver: boolean;
  lastDiceRoll: number | null;
}

const STAIR_THRESHOLD = 5; // Minimum stairs to reach the top

/**
 * Initialize a new game state
 */
export function initializeGame(): StairsGameState {
  return {
    currentStairCount: 0,
    isAtTop: false,
    canLaunchMiniGame: false,
    miniGameActive: false,
    miniGameType: null,
    miniGameResult: null,
    gamesPlayed: 0,
    gamesWon: 0,
    highestStairCount: 0,
    finalScore: 0,
    isGameOver: false,
    lastDiceRoll: null,
  };
}

/**
 * Roll a dice and return a value between 1 and 6
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Process a dice roll and update the game state
 */
export function processDiceRoll(state: StairsGameState, diceValue: number): StairsGameState {
  if (state.miniGameActive || state.isGameOver) {
    return state;
  }

  const newStairCount = state.currentStairCount + diceValue;
  const isAtTop = newStairCount >= STAIR_THRESHOLD;

  return {
    ...state,
    currentStairCount: newStairCount,
    isAtTop,
    canLaunchMiniGame: isAtTop,
    lastDiceRoll: diceValue,
  };
}

/**
 * Select a random mini-game type
 */
export function selectRandomMiniGame(): MiniGameType {
  const games: MiniGameType[] = ['rps', 'treasure-hunt', 'paroma', 'swimming-race'];
  const randomIndex = Math.floor(Math.random() * games.length);
  return games[randomIndex];
}

/**
 * Launch a mini-game
 */
export function launchMiniGame(state: StairsGameState): StairsGameState {
  if (!state.canLaunchMiniGame || state.miniGameActive || state.isGameOver) {
    return state;
  }

  const miniGameType = selectRandomMiniGame();

  return {
    ...state,
    miniGameActive: true,
    miniGameType,
    canLaunchMiniGame: false,
  };
}

/**
 * Process mini-game result
 * 
 * Rules:
 * - If first game is lost: final score = 0, game over
 * - If won: record current stair count, can continue playing
 * - If lost after winning before: keep previous high score, game over
 */
export function processMiniGameResult(
  state: StairsGameState,
  result: 'win' | 'lose'
): StairsGameState {
  if (!state.miniGameActive) {
    return state;
  }

  const gamesPlayed = state.gamesPlayed + 1;
  const gamesWon = result === 'win' ? state.gamesWon + 1 : state.gamesWon;

  // Case 1: First game and lost
  if (gamesPlayed === 1 && result === 'lose') {
    return {
      ...state,
      miniGameResult: result,
      gamesPlayed,
      gamesWon,
      finalScore: 0,
      isGameOver: true,
      miniGameActive: false,
    };
  }

  // Case 2: Won the mini-game
  if (result === 'win') {
    return {
      ...state,
      miniGameResult: result,
      gamesPlayed,
      gamesWon,
      highestStairCount: Math.max(state.highestStairCount, state.currentStairCount),
      miniGameActive: false,
      isAtTop: false, // Reset so player can roll dice again
    };
  }

  // Case 3: Lost after winning at least once before
  return {
    ...state,
    miniGameResult: result,
    gamesPlayed,
    gamesWon,
    finalScore: state.highestStairCount,
    isGameOver: true,
    miniGameActive: false,
  };
}

/**
 * Continue playing after winning a mini-game
 */
export function continueGame(state: StairsGameState): StairsGameState {
  if (state.isGameOver || state.miniGameActive) {
    return state;
  }

  return {
    ...state,
    miniGameResult: null,
    miniGameType: null,
    lastDiceRoll: null,
  };
}

/**
 * Get the final score for the scoreboard
 */
export function getFinalScore(state: StairsGameState): number {
  return state.finalScore;
}

/**
 * Check if the game is over and has a score to record
 */
export function shouldRecordScore(state: StairsGameState): boolean {
  return state.isGameOver && state.gamesPlayed > 0;
}
