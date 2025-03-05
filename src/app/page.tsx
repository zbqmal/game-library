import { games } from "./constants";

export default function Home() {
  return (
    <div>
      <h1>Game Library</h1>
      <ul>
        {games.map((game) => (
          <li key={game}>{game}</li>
        ))}
      </ul>
    </div>
  );
}
