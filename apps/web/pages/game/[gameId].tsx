import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { Game, ScoreRecord, ApiResponse } from '@game-library/shared';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export default function GamePage() {
  const router = useRouter();
  const { gameId } = router.query;

  const [game, setGame] = useState<Game | null>(null);
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (gameId && typeof gameId === 'string') {
      fetchGameData(gameId);
    }
  }, [gameId]);

  const fetchGameData = async (id: string) => {
    try {
      // Fetch game details
      const gameResponse = await fetch(`${API_URL}/api/games/${id}`);
      const gameData: ApiResponse<Game> = await gameResponse.json();

      if (gameData.success && gameData.data) {
        setGame(gameData.data);
      } else {
        setError(gameData.error || 'Game not found');
        setLoading(false);
        return;
      }

      // Fetch scores
      const scoresResponse = await fetch(`${API_URL}/api/games/${id}/scores`);
      const scoresData: ApiResponse<ScoreRecord[]> = await scoresResponse.json();

      if (scoresData.success && scoresData.data) {
        setScores(scoresData.data);
      }
    } catch (err) {
      setError('Failed to connect to API');
      console.error('Error fetching game data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="game-page">
          <p className="loading">Loading game...</p>
        </div>
      </Layout>
    );
  }

  if (error || !game) {
    return (
      <Layout>
        <div className="game-page">
          <div className="error">
            <p>⚠️ {error || 'Game not found'}</p>
            <button onClick={() => router.push('/')} className="btn-back">
              ← Back to Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="game-page">
        <div className="game-header">
          <button onClick={() => router.push('/')} className="btn-back">
            ← Back
          </button>
          <h1 className="game-page-title">{game.name}</h1>
          <p className="game-page-description">{game.description}</p>
          <div className="game-page-meta">
            <span className={`difficulty difficulty-${game.difficulty}`}>
              {game.difficulty}
            </span>
            <span className="players">
              {game.minPlayers === game.maxPlayers
                ? `${game.minPlayers} player${game.minPlayers > 1 ? 's' : ''}`
                : `${game.minPlayers}-${game.maxPlayers} players`}
            </span>
          </div>
        </div>

        <div className="game-content">
          <div className="game-main">
            <div className="game-placeholder">
              <p className="placeholder-text">🎮 Game will be implemented here</p>
              <p className="placeholder-hint">
                This is where the interactive game component will be loaded
              </p>
            </div>
          </div>

          <aside className="scoreboard">
            <h2 className="scoreboard-title">🏆 Top Scores</h2>
            {scores.length === 0 ? (
              <p className="no-scores">No scores yet. Be the first to play!</p>
            ) : (
              <div className="scores-list">
                {scores.map((score, index) => (
                  <div key={score.id} className="score-item">
                    <span className="score-rank">#{index + 1}</span>
                    <div className="score-info">
                      <span className="score-player">{score.playerName}</span>
                      <span className="score-date">
                        {new Date(score.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="score-value">{score.score}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
}
