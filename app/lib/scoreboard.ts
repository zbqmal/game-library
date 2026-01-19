export interface ScoreEntry {
  name: string;
  score: number;
  timestamp: number;
}

export interface ScoreboardAdapter {
  getTopScores(gameId: string, limit?: number): ScoreEntry[];
  saveScore(gameId: string, entry: Omit<ScoreEntry, 'timestamp'>): void;
  clearScores(gameId: string): void;
  isTopScore(gameId: string, score: number): boolean;
}

const STORAGE_PREFIX = 'game-library-scores-';
const MAX_SCORES_TO_RETRIEVE = 1000; // Used when retrieving all scores before filtering

class LocalStorageScoreboardAdapter implements ScoreboardAdapter {
  private getStorageKey(gameId: string): string {
    return `${STORAGE_PREFIX}${gameId}`;
  }

  getTopScores(gameId: string, limit: number = 10): ScoreEntry[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const key = this.getStorageKey(gameId);
      const data = localStorage.getItem(key);
      
      if (!data) {
        return [];
      }

      const scores: ScoreEntry[] = JSON.parse(data);
      
      // Sort by score (descending) and return top N
      return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error reading scores from localStorage:', error);
      return [];
    }
  }

  saveScore(gameId: string, entry: Omit<ScoreEntry, 'timestamp'>): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const key = this.getStorageKey(gameId);
      const existingScores = this.getTopScores(gameId, MAX_SCORES_TO_RETRIEVE); // Get all scores
      
      const newEntry: ScoreEntry = {
        ...entry,
        timestamp: Date.now(),
      };

      const updatedScores = [...existingScores, newEntry];
      
      // Keep only top 10
      const topScores = updatedScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      localStorage.setItem(key, JSON.stringify(topScores));
    } catch (error) {
      console.error('Error saving score to localStorage:', error);
    }
  }

  clearScores(gameId: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const key = this.getStorageKey(gameId);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing scores from localStorage:', error);
    }
  }

  isTopScore(gameId: string, score: number): boolean {
    const topScores = this.getTopScores(gameId, 10);
    
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
export const scoreboardAdapter = new LocalStorageScoreboardAdapter();
