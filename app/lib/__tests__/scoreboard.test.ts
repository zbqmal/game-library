import { scoreboardAdapter } from '../scoreboard';

// Mock fetch
global.fetch = jest.fn();

describe('Scoreboard Adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTopScores', () => {
    it('returns empty array when no scores exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scores: [] }),
      });

      const scores = await scoreboardAdapter.getTopScores('test-game');
      expect(scores).toEqual([]);
      expect(global.fetch).toHaveBeenCalledWith('/api/scoreboard/get-scores?gameId=test-game&limit=10');
    });

    it('returns saved scores sorted by score descending', async () => {
      const mockScores = [
        { name: 'Bob', score: 200, timestamp: Date.now() },
        { name: 'Charlie', score: 150, timestamp: Date.now() },
        { name: 'Alice', score: 100, timestamp: Date.now() },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scores: mockScores }),
      });

      const scores = await scoreboardAdapter.getTopScores('test-game');

      expect(scores).toHaveLength(3);
      expect(scores[0].name).toBe('Bob');
      expect(scores[0].score).toBe(200);
      expect(scores[1].name).toBe('Charlie');
      expect(scores[1].score).toBe(150);
      expect(scores[2].name).toBe('Alice');
      expect(scores[2].score).toBe(100);
    });

    it('limits results to specified limit', async () => {
      const mockScores = Array.from({ length: 5 }, (_, i) => ({
        name: `Player${i + 1}`,
        score: (i + 1) * 10,
        timestamp: Date.now(),
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scores: mockScores }),
      });

      const topFive = await scoreboardAdapter.getTopScores('test-game', 5);
      expect(topFive).toHaveLength(5);
      expect(global.fetch).toHaveBeenCalledWith('/api/scoreboard/get-scores?gameId=test-game&limit=5');
    });

    it('defaults to top 10 scores', async () => {
      const mockScores = Array.from({ length: 10 }, (_, i) => ({
        name: `Player${i + 1}`,
        score: (i + 1) * 10,
        timestamp: Date.now(),
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scores: mockScores }),
      });

      const scores = await scoreboardAdapter.getTopScores('test-game');
      expect(scores).toHaveLength(10);
    });

    it('returns scores for specific game only', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ scores: [{ name: 'Alice', score: 100, timestamp: Date.now() }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ scores: [{ name: 'Bob', score: 200, timestamp: Date.now() }] }),
        });

      const game1Scores = await scoreboardAdapter.getTopScores('game1');
      const game2Scores = await scoreboardAdapter.getTopScores('game2');

      expect(game1Scores).toHaveLength(1);
      expect(game1Scores[0].name).toBe('Alice');
      expect(game2Scores).toHaveLength(1);
      expect(game2Scores[0].name).toBe('Bob');
    });

    it('handles fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Error message',
      });

      const scores = await scoreboardAdapter.getTopScores('test-game');
      expect(scores).toEqual([]);
    });
  });

  describe('saveScore', () => {
    it('saves a score successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await scoreboardAdapter.saveScore('test-game', { name: 'Alice', score: 100 });

      expect(global.fetch).toHaveBeenCalledWith('/api/scoreboard/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: 'test-game',
          name: 'Alice',
          score: 100,
        }),
      });
    });

    it('handles save errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Error message',
      });

      await expect(
        scoreboardAdapter.saveScore('test-game', { name: 'Alice', score: 100 })
      ).resolves.not.toThrow();
    });
  });

  describe('clearScores', () => {
    it('clears all scores for a game', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await scoreboardAdapter.clearScores('test-game');

      expect(global.fetch).toHaveBeenCalledWith('/api/scoreboard/clear-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: 'test-game' }),
      });
    });

    it('handles clear errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Error message',
      });

      await expect(scoreboardAdapter.clearScores('test-game')).resolves.not.toThrow();
    });
  });

  describe('isTopScore', () => {
    it('returns true when fewer than 10 scores exist', async () => {
      const mockScores = Array.from({ length: 5 }, (_, i) => ({
        name: `Player${i + 1}`,
        score: (i + 1) * 10,
        timestamp: Date.now(),
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scores: mockScores }),
      });

      const result = await scoreboardAdapter.isTopScore('test-game', 1);
      expect(result).toBe(true);
    });

    it('returns true when score is higher than lowest top-10 score', async () => {
      const mockScores = Array.from({ length: 10 }, (_, i) => ({
        name: `Player${i + 1}`,
        score: (10 - i) * 10,
        timestamp: Date.now(),
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scores: mockScores }),
      });

      const result = await scoreboardAdapter.isTopScore('test-game', 50);
      expect(result).toBe(true);
    });

    it('returns false when score is lower than lowest top-10 score', async () => {
      const mockScores = Array.from({ length: 10 }, (_, i) => ({
        name: `Player${i + 1}`,
        score: (10 - i) * 10,
        timestamp: Date.now(),
      }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scores: mockScores }),
      });

      const result = await scoreboardAdapter.isTopScore('test-game', 5);
      expect(result).toBe(false);
    });

    it('returns true for first score in new game', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scores: [] }),
      });

      const result = await scoreboardAdapter.isTopScore('new-game', 1);
      expect(result).toBe(true);
    });
  });
});
