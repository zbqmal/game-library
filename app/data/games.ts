export interface Game {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  tags: string[];
  hasScoreboard: boolean;
  route: string;
}

export const games: Game[] = [
  {
    id: "1",
    title: "Up And Down",
    slug: "up-and-down",
    description:
      "Guess the secret number with limited attempts. Can you figure it out?",
    thumbnail: "/images/games/up-and-down.png",
    tags: ["logic", "puzzle", "single-player"],
    hasScoreboard: true,
    route: "/games/up-and-down",
  },
  {
    id: "2",
    title: "Rock-Paper-Scissors",
    slug: "rock-paper-scissors",
    description:
      "Play the classic game against the computer. Get consecutive wins for higher scores!",
    thumbnail: "/images/games/rock-paper-scissors.png",
    tags: ["classic", "quick", "single-player"],
    hasScoreboard: true,
    route: "/games/rock-paper-scissors",
  },
  {
    id: "3",
    title: "Treasure Hunt",
    slug: "treasure-hunt",
    description:
      "Two players take turns uncovering tiles to find the hidden treasure!",
    thumbnail: "/images/games/treasure-hunt.png",
    tags: ["two-player", "strategy", "quick"],
    hasScoreboard: false,
    route: "/games/treasure-hunt",
  },
  {
    id: "4",
    title: "47",
    slug: "47",
    description:
      "A timing challenge! Stop the timer at exactly 47.0 seconds. The timer fades out after 3 seconds.",
    thumbnail: "/images/games/47.png",
    tags: ["timing", "challenge", "single-player"],
    hasScoreboard: false,
    route: "/games/47",
  },
  {
    id: "5",
    title: "Twenty Questions",
    slug: "twenty-questions",
    description:
      "I'm thinking of a noun. Ask yes/no questions or make guesses to figure it out in 20 attempts!",
    thumbnail: "/images/games/twenty-questions.png",
    tags: ["logic", "puzzle", "single-player", "word-game"],
    hasScoreboard: false,
    route: "/games/twenty-questions",
  },
];
