export interface ScoreEntry {
  name: string;
  score: number;
  timestamp: number;
}

export interface ScoreboardAdapter {
  getTopScores(gameId: string, limit?: number): Promise<ScoreEntry[]>;
  saveScore(gameId: string, entry: Omit<ScoreEntry, 'timestamp'>): Promise<void>;
  clearScores(gameId: string): Promise<void>;
  isTopScore(gameId: string, score: number): Promise<boolean>;
}

const STORAGE_PREFIX = 'game-library-scores-';
const MAX_SCORES_TO_RETRIEVE = 1000; // Used when retrieving all scores before filtering

class FirestoreScoreboardAdapter implements ScoreboardAdapter {
  async getTopScores(gameId: string, limit: number = 10): Promise<ScoreEntry[]> {
    try {
      const response = await fetch(`/api/scoreboard/get-scores?gameId=${encodeURIComponent(gameId)}&limit=${limit}`);
      
      if (!response.ok) {
        console.error('Error fetching scores:', await response.text());
        return [];
      }

      const data = await response.json();
      return data.scores || [];
    } catch (error) {
      console.error('Error fetching scores:', error);
      return [];
    }
  }

  async saveScore(gameId: string, entry: Omit<ScoreEntry, 'timestamp'>): Promise<void> {
    try {
      const response = await fetch('/api/scoreboard/save-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          name: entry.name,
          score: entry.score,
        }),
      });

      if (!response.ok) {
        console.error('Error saving score:', await response.text());
      }
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }

  async clearScores(gameId: string): Promise<void> {
    try {
      const response = await fetch('/api/scoreboard/clear-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId }),
      });

      if (!response.ok) {
        console.error('Error clearing scores:', await response.text());
      }
    } catch (error) {
      console.error('Error clearing scores:', error);
    }
  }

  async isTopScore(gameId: string, score: number): Promise<boolean> {
    const topScores = await this.getTopScores(gameId, 10);
    
    // If we have less than 10 scores, any score qualifies
    if (topScores.length < 10) {
      return true;
    }

    // Check if this score is better than the worst top-10 score
    const lowestTopScore = topScores[topScores.length - 1];
    return score > lowestTopScore.score;
  }
}

// Export a singleton instance
export const scoreboardAdapter = new FirestoreScoreboardAdapter();
