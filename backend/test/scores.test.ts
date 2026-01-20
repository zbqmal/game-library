import { buildApp } from '../src/index';
import { FastifyInstance } from 'fastify';
import { promises as fs } from 'fs';
import { join } from 'path';

const SCORES_FILE = join(__dirname, '../scores.json');

describe('Scores API', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up scores file before each test
    try {
      await fs.unlink(SCORES_FILE);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  afterEach(async () => {
    // Clean up scores file after each test
    try {
      await fs.unlink(SCORES_FILE);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe('POST /scores/:gameId', () => {
    it('should save a score successfully', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/scores/test-game',
        payload: {
          name: 'Alice',
          score: 100,
        },
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.name).toBe('Alice');
      expect(body.score).toBe(100);
      expect(body.timestamp).toBeDefined();
      expect(typeof body.timestamp).toBe('number');
    });

    it('should reject missing name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/scores/test-game',
        payload: {
          score: 100,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('Name is required');
    });

    it('should reject name longer than 50 characters', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/scores/test-game',
        payload: {
          name: 'A'.repeat(51),
          score: 100,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('50 characters');
    });

    it('should reject negative score', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/scores/test-game',
        payload: {
          name: 'Bob',
          score: -1,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('non-negative integer');
    });

    it('should reject non-integer score', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/scores/test-game',
        payload: {
          name: 'Bob',
          score: 10.5,
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('non-negative integer');
    });

    it('should reject invalid score type', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/scores/test-game',
        payload: {
          name: 'Bob',
          score: 'invalid',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toContain('non-negative integer');
    });
  });

  describe('GET /scores/:gameId/top10', () => {
    it('should return empty array when no scores exist', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/scores/test-game/top10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scores).toEqual([]);
    });

    it('should return scores sorted by score descending', async () => {
      // Add multiple scores
      await app.inject({
        method: 'POST',
        url: '/scores/test-game',
        payload: { name: 'Alice', score: 100 },
      });

      await app.inject({
        method: 'POST',
        url: '/scores/test-game',
        payload: { name: 'Bob', score: 200 },
      });

      await app.inject({
        method: 'POST',
        url: '/scores/test-game',
        payload: { name: 'Charlie', score: 150 },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/scores/test-game/top10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scores).toHaveLength(3);
      expect(body.scores[0].name).toBe('Bob');
      expect(body.scores[0].score).toBe(200);
      expect(body.scores[1].name).toBe('Charlie');
      expect(body.scores[1].score).toBe(150);
      expect(body.scores[2].name).toBe('Alice');
      expect(body.scores[2].score).toBe(100);
    });

    it('should return only top 10 scores', async () => {
      // Add 15 scores
      for (let i = 1; i <= 15; i++) {
        await app.inject({
          method: 'POST',
          url: '/scores/test-game',
          payload: { name: `Player${i}`, score: i * 10 },
        });
      }

      const response = await app.inject({
        method: 'GET',
        url: '/scores/test-game/top10',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.scores).toHaveLength(10);
      // Highest score should be first (150)
      expect(body.scores[0].score).toBe(150);
      // Lowest in top 10 should be 60
      expect(body.scores[9].score).toBe(60);
    });

    it('should isolate scores by game ID', async () => {
      // Add scores to different games
      await app.inject({
        method: 'POST',
        url: '/scores/game1',
        payload: { name: 'Alice', score: 100 },
      });

      await app.inject({
        method: 'POST',
        url: '/scores/game2',
        payload: { name: 'Bob', score: 200 },
      });

      const response1 = await app.inject({
        method: 'GET',
        url: '/scores/game1/top10',
      });

      const response2 = await app.inject({
        method: 'GET',
        url: '/scores/game2/top10',
      });

      const body1 = JSON.parse(response1.body);
      const body2 = JSON.parse(response2.body);

      expect(body1.scores).toHaveLength(1);
      expect(body1.scores[0].name).toBe('Alice');

      expect(body2.scores).toHaveLength(1);
      expect(body2.scores[0].name).toBe('Bob');
    });
  });

  describe('Health check', () => {
    it('should return ok status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
    });
  });
});
