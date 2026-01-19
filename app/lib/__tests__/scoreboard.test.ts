import { describe, it, expect, beforeEach } from '@jest/globals';
import { scoreboardAdapter } from '../scoreboard';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Scoreboard Adapter', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('getTopScores', () => {
    it('returns empty array when no scores exist', () => {
      const scores = scoreboardAdapter.getTopScores('test-game');
      expect(scores).toEqual([]);
    });

    it('returns saved scores sorted by score descending', () => {
      scoreboardAdapter.saveScore('test-game', { name: 'Alice', score: 100 });
      scoreboardAdapter.saveScore('test-game', { name: 'Bob', score: 200 });
      scoreboardAdapter.saveScore('test-game', { name: 'Charlie', score: 150 });

      const scores = scoreboardAdapter.getTopScores('test-game');

      expect(scores).toHaveLength(3);
      expect(scores[0].name).toBe('Bob');
      expect(scores[0].score).toBe(200);
      expect(scores[1].name).toBe('Charlie');
      expect(scores[1].score).toBe(150);
      expect(scores[2].name).toBe('Alice');
      expect(scores[2].score).toBe(100);
    });

    it('limits results to specified limit', () => {
      for (let i = 1; i <= 15; i++) {
        scoreboardAdapter.saveScore('test-game', { name: `Player${i}`, score: i * 10 });
      }

      const topFive = scoreboardAdapter.getTopScores('test-game', 5);
      expect(topFive).toHaveLength(5);
    });

    it('defaults to top 10 scores', () => {
      for (let i = 1; i <= 15; i++) {
        scoreboardAdapter.saveScore('test-game', { name: `Player${i}`, score: i * 10 });
      }

      const scores = scoreboardAdapter.getTopScores('test-game');
      expect(scores).toHaveLength(10);
    });

    it('returns scores for specific game only', () => {
      scoreboardAdapter.saveScore('game1', { name: 'Alice', score: 100 });
      scoreboardAdapter.saveScore('game2', { name: 'Bob', score: 200 });

      const game1Scores = scoreboardAdapter.getTopScores('game1');
      const game2Scores = scoreboardAdapter.getTopScores('game2');

      expect(game1Scores).toHaveLength(1);
      expect(game1Scores[0].name).toBe('Alice');
      expect(game2Scores).toHaveLength(1);
      expect(game2Scores[0].name).toBe('Bob');
    });
  });

  describe('saveScore', () => {
    it('saves a score with timestamp', () => {
      const beforeTime = Date.now();
      scoreboardAdapter.saveScore('test-game', { name: 'Alice', score: 100 });
      const afterTime = Date.now();

      const scores = scoreboardAdapter.getTopScores('test-game');

      expect(scores).toHaveLength(1);
      expect(scores[0].name).toBe('Alice');
      expect(scores[0].score).toBe(100);
      expect(scores[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(scores[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('maintains only top 10 scores', () => {
      for (let i = 1; i <= 15; i++) {
        scoreboardAdapter.saveScore('test-game', { name: `Player${i}`, score: i * 10 });
      }

      const scores = scoreboardAdapter.getTopScores('test-game', 100);

      expect(scores).toHaveLength(10);
      expect(scores[0].score).toBe(150); // Highest score
      expect(scores[9].score).toBe(60); // 10th highest
    });

    it('replaces lower scores with higher scores', () => {
      // Fill with 10 low scores
      for (let i = 1; i <= 10; i++) {
        scoreboardAdapter.saveScore('test-game', { name: `Player${i}`, score: i });
      }

      // Add a high score
      scoreboardAdapter.saveScore('test-game', { name: 'Champion', score: 1000 });

      const scores = scoreboardAdapter.getTopScores('test-game', 100);

      expect(scores).toHaveLength(10);
      expect(scores[0].name).toBe('Champion');
      expect(scores[0].score).toBe(1000);
      // Lowest score should be 2 (score 1 should be dropped)
      expect(scores[9].score).toBe(2);
    });
  });

  describe('clearScores', () => {
    it('removes all scores for a game', () => {
      scoreboardAdapter.saveScore('test-game', { name: 'Alice', score: 100 });
      scoreboardAdapter.saveScore('test-game', { name: 'Bob', score: 200 });

      scoreboardAdapter.clearScores('test-game');

      const scores = scoreboardAdapter.getTopScores('test-game');
      expect(scores).toEqual([]);
    });

    it('only clears scores for specified game', () => {
      scoreboardAdapter.saveScore('game1', { name: 'Alice', score: 100 });
      scoreboardAdapter.saveScore('game2', { name: 'Bob', score: 200 });

      scoreboardAdapter.clearScores('game1');

      expect(scoreboardAdapter.getTopScores('game1')).toEqual([]);
      expect(scoreboardAdapter.getTopScores('game2')).toHaveLength(1);
    });
  });

  describe('isTopScore', () => {
    it('returns true when fewer than 10 scores exist', () => {
      for (let i = 1; i <= 5; i++) {
        scoreboardAdapter.saveScore('test-game', { name: `Player${i}`, score: i * 10 });
      }

      expect(scoreboardAdapter.isTopScore('test-game', 1)).toBe(true);
    });

    it('returns true when score is higher than lowest top-10 score', () => {
      for (let i = 1; i <= 10; i++) {
        scoreboardAdapter.saveScore('test-game', { name: `Player${i}`, score: i * 10 });
      }

      expect(scoreboardAdapter.isTopScore('test-game', 50)).toBe(true);
    });

    it('returns false when score is lower than lowest top-10 score', () => {
      for (let i = 1; i <= 10; i++) {
        scoreboardAdapter.saveScore('test-game', { name: `Player${i}`, score: i * 10 });
      }

      expect(scoreboardAdapter.isTopScore('test-game', 5)).toBe(false);
    });

    it('returns true for first score in new game', () => {
      expect(scoreboardAdapter.isTopScore('new-game', 1)).toBe(true);
    });
  });
});
