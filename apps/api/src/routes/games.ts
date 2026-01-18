import { FastifyInstance, FastifyRequest } from 'fastify';
import { Game, GameId } from '@game-library/shared';

// Sample game data - in production, this would come from the database
const sampleGames: Game[] = [
  {
    id: 'up-and-down',
    name: 'Up and Down',
    description: 'Guess a number between 0 and 100 in 5 tries',
    difficulty: 'easy',
    minPlayers: 1,
    maxPlayers: 1,
    thumbnail: '/games/up-and-down.png',
  },
  {
    id: 'tic-tac-toe',
    name: 'Tic Tac Toe',
    description: 'Classic Tic Tac Toe game',
    difficulty: 'easy',
    minPlayers: 2,
    maxPlayers: 2,
    thumbnail: '/games/tic-tac-toe.png',
  },
  {
    id: 'memory-match',
    name: 'Memory Match',
    description: 'Match pairs of cards',
    difficulty: 'medium',
    minPlayers: 1,
    maxPlayers: 1,
    thumbnail: '/games/memory-match.png',
  },
];

export async function gamesRoutes(fastify: FastifyInstance) {
  // GET /api/games - Get all games
  fastify.get('/games', async () => {
    return {
      success: true,
      data: sampleGames,
    };
  });

  // GET /api/games/:id - Get a specific game
  fastify.get<{ Params: { id: GameId } }>(
    '/games/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>) => {
      const game = sampleGames.find((g) => g.id === request.params.id);

      if (!game) {
        return {
          success: false,
          error: 'Game not found',
        };
      }

      return {
        success: true,
        data: game,
      };
    }
  );
}
