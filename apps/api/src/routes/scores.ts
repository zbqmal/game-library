import { FastifyInstance, FastifyRequest } from 'fastify';
import { ScoreRecord, CreateScorePayload, GameId } from '@game-library/shared';

// Sample scores data - in production, this would come from the database
const sampleScores: ScoreRecord[] = [
  {
    id: '1',
    gameId: 'up-and-down',
    playerName: 'Alice',
    score: 950,
    completedAt: new Date('2024-01-15'),
    metadata: { attempts: 3 },
  },
  {
    id: '2',
    gameId: 'up-and-down',
    playerName: 'Bob',
    score: 850,
    completedAt: new Date('2024-01-16'),
    metadata: { attempts: 4 },
  },
  {
    id: '3',
    gameId: 'tic-tac-toe',
    playerName: 'Charlie',
    score: 1000,
    completedAt: new Date('2024-01-17'),
    metadata: { wins: 5 },
  },
];

export async function scoresRoutes(fastify: FastifyInstance) {
  // GET /api/games/:id/scores - Get scores for a specific game
  fastify.get<{ Params: { id: GameId } }>(
    '/games/:id/scores',
    async (request: FastifyRequest<{ Params: { id: string } }>) => {
      const gameScores = sampleScores
        .filter((s) => s.gameId === request.params.id)
        .sort((a, b) => b.score - a.score) // Sort by score descending
        .slice(0, 10); // Top 10 scores

      return {
        success: true,
        data: gameScores,
      };
    }
  );

  // POST /api/games/:id/scores - Create a new score
  fastify.post<{
    Params: { id: string };
    Body: CreateScorePayload;
  }>(
    '/games/:id/scores',
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: CreateScorePayload;
      }>
    ) => {
      const { id } = request.params;
      const payload = request.body;

      // Validate that the gameId in URL matches the payload
      if (id !== payload.gameId) {
        return {
          success: false,
          error: 'Game ID mismatch',
        };
      }

      // In production, save to database via Prisma
      // For now, just echo back the data with a generated ID
      const newScore: ScoreRecord = {
        id: Math.random().toString(36).substring(7),
        gameId: payload.gameId,
        playerName: payload.playerName,
        score: payload.score,
        completedAt: new Date(),
        metadata: payload.metadata,
      };

      // Add to sample data (in-memory only)
      sampleScores.push(newScore);

      return {
        success: true,
        data: newScore,
      };
    }
  );
}
