import { render, screen } from "@testing-library/react";
import GameGrid from "../GameGrid";
import { Game } from "../../../data/games";
import { translationEngine } from "@/app/translation-engine";

const mockGames: Game[] = [
  {
    id: "1",
    title: "Test Game 1",
    slug: "test-game-1",
    description: "A test game",
    thumbnail: "/images/test1.png",
    tags: ["test", "game"],
    hasScoreboard: true,
    route: "/games/test-1",
  },
  {
    id: "2",
    title: "Test Game 2",
    slug: "test-game-2",
    description: "Another test game",
    thumbnail: "/images/test2.png",
    tags: ["test"],
    hasScoreboard: false,
    route: "/games/test-2",
  },
];

describe("GameGrid", () => {
  beforeEach(() => {
    localStorage.clear();
    translationEngine.changeLanguage("en");
  });

  it("renders game tiles for each game", () => {
    render(<GameGrid games={mockGames} />);

    expect(screen.getByText("Test Game 1")).toBeInTheDocument();
    expect(screen.getByText("Test Game 2")).toBeInTheDocument();
  });

  it("displays empty state when no games are provided", () => {
    render(<GameGrid games={[]} />);

    expect(screen.getByText(/No games found/i)).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search/i)).toBeInTheDocument();
  });

  it("shows loading skeletons when isLoading is true", () => {
    render(<GameGrid games={[]} isLoading={true} />);

    // Should show skeleton cards (they have animate-pulse class)
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);

    // Should not show empty state
    expect(screen.queryByText(/No games found/i)).not.toBeInTheDocument();
  });

  it("renders correct number of games", () => {
    const { container } = render(<GameGrid games={mockGames} />);

    // Each game should have a link element
    const links = container.querySelectorAll("a");
    expect(links.length).toBe(mockGames.length);
  });

  it("applies responsive grid classes", () => {
    const { container } = render(<GameGrid games={mockGames} />);

    const gridElement = container.querySelector(".grid");
    expect(gridElement).toBeInTheDocument();
    expect(gridElement).toHaveClass(
      "grid-cols-1",
      "md:grid-cols-2",
      "lg:grid-cols-3",
    );
  });

  it("renders Spanish empty state when language is Spanish", () => {
    translationEngine.changeLanguage("es");
    render(<GameGrid games={[]} />);

    expect(screen.getByText(/No se encontraron juegos/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Intenta ajustar tu búsqueda/i),
    ).toBeInTheDocument();
  });
});
