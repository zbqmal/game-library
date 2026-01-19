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
    title: "Number Guessing",
    slug: "number-guess",
    description: "Guess the secret number with limited attempts. Can you figure it out?",
    thumbnail: "/images/games/number-guess.png",
    tags: ["logic", "puzzle", "single-player"],
    hasScoreboard: true,
    route: "/games/number-guess",
  },
  {
    id: "2",
    title: "Rock-Paper-Scissors",
    slug: "rock-paper-scissors",
    description: "Play the classic game against the computer. Get consecutive wins for higher scores!",
    thumbnail: "/images/games/rock-paper-scissors.png",
    tags: ["classic", "quick", "single-player"],
    hasScoreboard: true,
    route: "/games/rock-paper-scissors",
  },
  {
    id: "3",
    title: "Stairs",
    slug: "stairs",
    description: "Climb stairs and win mini-games to achieve the highest score possible!",
    thumbnail: "/images/games/stairs.png",
    tags: ["arcade", "challenge", "mini-games"],
    hasScoreboard: true,
    route: "/games/stairs",
  },
];
