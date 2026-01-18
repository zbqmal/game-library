import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { Game, ApiResponse } from '@game-library/shared';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch(`${API_URL}/api/games`);
      const data: ApiResponse<Game[]> = await response.json();

      if (data.success && data.data) {
        setGames(data.data);
      } else {
        setError(data.error || 'Failed to fetch games');
      }
    } catch (err) {
      setError('Failed to connect to API');
      console.error('Error fetching games:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="home-container">
        <section className="hero">
          <h1 className="hero-title">Welcome to Game Library</h1>
          <p className="hero-subtitle">
            A collection of simple and enjoyable games to play
          </p>
        </section>

        <section className="games-section">
          <h2 className="section-title">Available Games</h2>

          {loading && <p className="loading">Loading games...</p>}

          {error && (
            <div className="error">
              <p>⚠️ {error}</p>
              <p className="error-hint">
                Make sure the API server is running on port 3001
              </p>
            </div>
          )}

          {!loading && !error && games.length === 0 && (
            <p className="no-games">No games available yet.</p>
          )}

          {!loading && !error && games.length > 0 && (
            <div className="games-grid">
              {games.map((game) => (
                <Link
                  href={`/game/${game.id}`}
                  key={game.id}
                  className="game-card"
                >
                  <div className="game-thumbnail">
                    {game.thumbnail ? (
                      <img src={game.thumbnail} alt={game.name} />
                    ) : (
                      <div className="game-placeholder">🎮</div>
                    )}
                  </div>
                  <div className="game-info">
                    <h3 className="game-title">{game.name}</h3>
                    <p className="game-description">{game.description}</p>
                    <div className="game-meta">
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
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
