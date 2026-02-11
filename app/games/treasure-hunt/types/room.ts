import { Timestamp } from 'firebase/firestore';
import { GameState } from '../gameLogic';

export interface Player {
  playerId: string;
  username: string;
  playerNumber: number;
  joinedAt: Timestamp;
  isHost: boolean;
}

export interface Room {
  roomCode: string;
  hostId: string;
  gameId: 'treasure-hunt';
  status: 'waiting' | 'playing' | 'finished';
  createdAt: Timestamp;
  lastActivity: Timestamp;
  config: {
    gridSize: number;
    maxPlayers: number;
  };
  gameState: GameState | null;
  players: Record<string, Player>;
}
