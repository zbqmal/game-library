import { promises as fs } from 'fs';
import { join } from 'path';

export interface ScoreEntry {
  name: string;
  score: number;
  timestamp: number;
}

interface ScoreData {
  [gameId: string]: ScoreEntry[];
}

const SCORES_FILE = join(__dirname, '../scores.json');

class ScoreStore {
  private async readScores(): Promise<ScoreData> {
    try {
      const data = await fs.readFile(SCORES_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error: unknown) {
      // If file doesn't exist, return empty object
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return {};
      }
      throw error;
    }
  }

  private async writeScores(data: ScoreData): Promise<void> {
    await fs.writeFile(SCORES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  }

  async getTopScores(gameId: string, limit: number = 10): Promise<ScoreEntry[]> {
    const data = await this.readScores();
    const scores = data[gameId] || [];
    
    // Sort by score descending, then by timestamp ascending (earlier is better)
    return scores
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.timestamp - b.timestamp;
      })
      .slice(0, limit);
  }

  async saveScore(gameId: string, entry: Omit<ScoreEntry, 'timestamp'>): Promise<ScoreEntry> {
    const data = await this.readScores();
    
    if (!data[gameId]) {
      data[gameId] = [];
    }

    const newEntry: ScoreEntry = {
      ...entry,
      timestamp: Date.now(),
    };

    data[gameId].push(newEntry);
    
    // Keep only top 100 to prevent unbounded growth
    data[gameId] = data[gameId]
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.timestamp - b.timestamp;
      })
      .slice(0, 100);

    await this.writeScores(data);
    
    return newEntry;
  }
}

export const scoreStore = new ScoreStore();
