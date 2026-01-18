/**
 * Shared TypeScript types for Game Library
 * Used across frontend and backend
 */

// Supported game identifiers
export type GameId = 'up-and-down' | 'tic-tac-toe' | 'memory-match';

// Game metadata interface
export interface Game {
  id: GameId;
  name: string;
  description: string;
  thumbnail?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  minPlayers: number;
  maxPlayers: number;
}

// Score record interface
export interface ScoreRecord {
  id: string;
  gameId: GameId;
  playerName: string;
  score: number;
  completedAt: Date;
  metadata?: Record<string, unknown>;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateScorePayload {
  gameId: GameId;
  playerName: string;
  score: number;
  metadata?: Record<string, unknown>;
}
