import { ScoreEntry } from './scoreboard';

// Use window.location for dynamic API URL in browser, fallback to localhost for SSR
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // In browser, use environment variable or localhost
    const win = window as { NEXT_PUBLIC_API_URL?: string };
    return win.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }
  // In SSR, use environment variable or localhost
  return 'http://localhost:3001';
};

/**
 * API-based scoreboard adapter that calls the backend service.
 * 
 * Note: This adapter uses async methods, which differs from the localStorage adapter.
 * In Phase 4, components will need to be updated to handle async operations when
 * switching to this adapter. This is intentional to prepare for database integration
 * in Phase 5.
 * 
 * To use this adapter, import it and replace calls to scoreboardAdapter with
 * apiScoreboardAdapter, ensuring you handle promises appropriately.
 */
export class ApiScoreboardAdapter {
  private async fetchWithErrorHandling(url: string, options?: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return response;
    } catch (error) {
      if (error instanceof Error) {
        console.error('API request failed:', error.message);
      }
      throw error;
    }
  }

  async getTopScores(gameId: string): Promise<ScoreEntry[]> {
    try {
      const API_BASE_URL = getApiBaseUrl();
      const response = await this.fetchWithErrorHandling(
        `${API_BASE_URL}/scores/${encodeURIComponent(gameId)}/top10`
      );
      
      const data = await response.json();
      return data.scores || [];
    } catch (error) {
      console.error('Failed to fetch top scores:', error);
      // Return empty array on error to match localStorage behavior
      return [];
    }
  }

  async saveScore(gameId: string, entry: Omit<ScoreEntry, 'timestamp'>): Promise<void> {
    try {
      const API_BASE_URL = getApiBaseUrl();
      await this.fetchWithErrorHandling(
        `${API_BASE_URL}/scores/${encodeURIComponent(gameId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: entry.name,
            score: entry.score,
          }),
        }
      );
    } catch (error) {
      console.error('Failed to save score:', error);
      // Rethrow to allow caller to handle
      throw error;
    }
  }

  clearScores(): void {
    // Not implemented in Phase 4 - backend doesn't have a clear endpoint
    console.warn('clearScores not implemented for API adapter');
  }

  async isTopScore(gameId: string, score: number): Promise<boolean> {
    try {
      const topScores = await this.getTopScores(gameId);
      
      // If we have less than 10 scores, any score qualifies
      if (topScores.length < 10) {
        return true;
      }

      // Check if this score is better than the worst top-10 score
      const lowestTopScore = topScores[topScores.length - 1];
      return score > lowestTopScore.score;
    } catch (error) {
      console.error('Failed to check if top score:', error);
      // On error, assume it might be a top score
      return true;
    }
  }
}

// Export a singleton instance
export const apiScoreboardAdapter = new ApiScoreboardAdapter();
