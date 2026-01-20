import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { scoreStore } from '../store';

interface ScoreParams {
  gameId: string;
}

interface SaveScoreBody {
  name: string;
  score: number;
}

export async function scoresRoutes(fastify: FastifyInstance) {
  // GET /scores/:gameId/top10 - Get top 10 scores for a game
  fastify.get<{ Params: ScoreParams }>(
    '/scores/:gameId/top10',
    async (request: FastifyRequest<{ Params: ScoreParams }>, reply: FastifyReply) => {
      const { gameId } = request.params;
      
      try {
        const scores = await scoreStore.getTopScores(gameId, 10);
        return reply.send({ scores });
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Failed to retrieve scores' });
      }
    }
  );

  // POST /scores/:gameId - Save a new score
  fastify.post<{ Params: ScoreParams; Body: SaveScoreBody }>(
    '/scores/:gameId',
    async (request: FastifyRequest<{ Params: ScoreParams; Body: SaveScoreBody }>, reply: FastifyReply) => {
      const { gameId } = request.params;
      const { name, score } = request.body;

      // Validate input
      if (!name || typeof name !== 'string') {
        return reply.status(400).send({ error: 'Name is required and must be a string' });
      }

      if (name.length > 50) {
        return reply.status(400).send({ error: 'Name must be 50 characters or less' });
      }

      if (typeof score !== 'number' || !Number.isInteger(score) || score < 0) {
        return reply.status(400).send({ error: 'Score must be a non-negative integer' });
      }

      try {
        const savedEntry = await scoreStore.saveScore(gameId, { name, score });
        return reply.status(201).send(savedEntry);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: 'Failed to save score' });
      }
    }
  );
}
