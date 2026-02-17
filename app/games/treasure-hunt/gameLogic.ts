export type TileState = "covered" | "uncovered-empty" | "uncovered-treasure";
export type PlayerTurn = 1 | 2 | 3 | 4 | 5 | 6;

export interface GameConfig {
  playerCount: number;
  playerNames: string[];
  gridSize: number; // e.g., 3 for 3x3, 4 for 4x4
}

export interface GameState {
  tiles: TileState[];
  treasurePosition: number;
  currentPlayer: PlayerTurn;
  winner: PlayerTurn | null;
  isGameOver: boolean;
  playerCount: number;
  playerNames: string[];
  gridSize: number;
}

/**
 * Validate player count against constraints
 * Now enforces 2-6 players range
 */
export function validatePlayerCount(
  playerCount: number,
  totalTiles: number,
): boolean {
  // Player count must be at least 2
  if (playerCount < 2) {
    return false;
  }

  // Absolute maximum is 6 players
  if (playerCount > 6) {
    return false;
  }

  // Player count must not exceed half of total tiles
  if (playerCount > totalTiles / 2) {
    return false;
  }

  return true;
}

/**
 * Validate a single player name
 * Maximum length: 20 characters
 */
export function validatePlayerName(name: string): boolean {
  return name.length <= 20;
}

/**
 * Validate all player names
 */
export function validatePlayerNames(names: string[]): boolean {
  return names.every(validatePlayerName);
}

/**
 * Get default player name for a given index
 */
export function getDefaultPlayerName(index: number): string {
  return `Player ${index + 1}`;
}

/**
 * Normalize player names: assign defaults to empty names
 */
export function normalizePlayerNames(names: string[]): string[] {
  return names.map((name, index) =>
    name.trim() === "" ? getDefaultPlayerName(index) : name,
  );
}

/**
 * Validate grid size against constraints
 */
export function validateGridSize(gridSize: number): boolean {
  // Minimum grid size is 3 (3x3 = 9 tiles)
  if (gridSize < 3) {
    return false;
  }

  // Maximum grid size is 6 (6x6 = 36 tiles)
  if (gridSize > 6) {
    return false;
  }

  return true;
}

/**
 * Validate game configuration
 */
export function validateGameConfig(config: GameConfig): {
  valid: boolean;
  error?: string;
} {
  const { playerCount, playerNames, gridSize } = config;

  // Validate grid size
  if (!validateGridSize(gridSize)) {
    return { valid: false, error: 'Grid size must be between 3 and 6' };
  }

  // Calculate max players based on grid size
  // 3x3 grid allows max 4 players, all other sizes allow max 6 players
  const maxPlayers = gridSize === 3 ? 4 : 6;

  // Validate player count
  if (playerCount < 2) {
    return { valid: false, error: 'At least 2 players are required' };
  }

  if (playerCount > 6) {
    return { valid: false, error: 'Maximum 6 players allowed' };
  }

  if (playerCount > maxPlayers) {
    return {
      valid: false,
      error: `Maximum ${maxPlayers} players allowed for ${gridSize}×${gridSize} grid`,
    };
  }

  if (playerNames.length !== playerCount) {
    return {
      valid: false,
      error: 'Number of player names must match player count',
    };
  }

  if (!validatePlayerNames(playerNames)) {
    return {
      valid: false,
      error: 'Each player name must not exceed 20 characters',
    };
  }

  return { valid: true };
}

/**
 * Initialize a new game with random treasure placement
 */
export function initializeGame(config?: GameConfig): GameState {
  // Default configuration for backward compatibility
  const defaultConfig: GameConfig = {
    playerCount: 2,
    playerNames: ["Player 1", "Player 2"],
    gridSize: 3,
  };

  const gameConfig = config || defaultConfig;

  // Validate configuration
  const validation = validateGameConfig(gameConfig);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const totalTiles = gameConfig.gridSize * gameConfig.gridSize;
  const treasurePosition = Math.floor(Math.random() * totalTiles);

  return {
    tiles: Array(totalTiles).fill("covered"),
    treasurePosition,
    currentPlayer: 1,
    winner: null,
    isGameOver: false,
    playerCount: gameConfig.playerCount,
    playerNames: gameConfig.playerNames,
    gridSize: gameConfig.gridSize,
  };
}

/**
 * Uncover a tile at the specified position
 */
export function uncoverTile(state: GameState, position: number): GameState {
  // Don't allow uncovering if game is over or tile is already uncovered
  if (state.isGameOver || state.tiles[position] !== "covered") {
    return state;
  }

  const newTiles = [...state.tiles];
  const isTreasure = position === state.treasurePosition;

  // Update tile state
  newTiles[position] = isTreasure ? "uncovered-treasure" : "uncovered-empty";

  if (isTreasure) {
    // Current player wins
    return {
      ...state,
      tiles: newTiles,
      winner: state.currentPlayer,
      isGameOver: true,
    };
  }

  // Switch to next player (cycling through all players)
  const nextPlayer = ((state.currentPlayer % state.playerCount) +
    1) as PlayerTurn;

  return {
    ...state,
    tiles: newTiles,
    currentPlayer: nextPlayer,
  };
}
