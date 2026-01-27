export type TileState = 'covered' | 'uncovered-empty' | 'uncovered-treasure';
export type PlayerTurn = 1 | 2;

export interface GameState {
  tiles: TileState[];
  treasurePosition: number;
  currentPlayer: PlayerTurn;
  winner: PlayerTurn | null;
  isGameOver: boolean;
}

/**
 * Initialize a new game with random treasure placement
 */
export function initializeGame(): GameState {
  const treasurePosition = Math.floor(Math.random() * 9);
  
  return {
    tiles: Array(9).fill('covered'),
    treasurePosition,
    currentPlayer: 1,
    winner: null,
    isGameOver: false,
  };
}

/**
 * Uncover a tile at the specified position
 */
export function uncoverTile(state: GameState, position: number): GameState {
  // Don't allow uncovering if game is over or tile is already uncovered
  if (state.isGameOver || state.tiles[position] !== 'covered') {
    return state;
  }

  const newTiles = [...state.tiles];
  const isTreasure = position === state.treasurePosition;
  
  // Update tile state
  newTiles[position] = isTreasure ? 'uncovered-treasure' : 'uncovered-empty';

  if (isTreasure) {
    // Current player wins
    return {
      ...state,
      tiles: newTiles,
      winner: state.currentPlayer,
      isGameOver: true,
    };
  }

  // Switch to next player
  const nextPlayer: PlayerTurn = state.currentPlayer === 1 ? 2 : 1;

  return {
    ...state,
    tiles: newTiles,
    currentPlayer: nextPlayer,
  };
}
