import { render, screen } from "@testing-library/react";
import GameTile from "../GameTile";
import { Game } from "../../../data/games";
import { translationEngine } from "@/app/translation-engine";

const mockGame: Game = {
  id: "1",
  title: "Test Game",
  slug: "test-game",
  description: "This is a test game description",
  thumbnail: "/images/test.png",
  tags: ["test", "puzzle", "fun"],
  hasScoreboard: true,
  route: "/games/test-game",
};

describe("GameTile", () => {
  beforeEach(() => {
    localStorage.clear();
    translationEngine.changeLanguage("en");
  });

  it("renders game title and description", () => {
    render(<GameTile game={mockGame} />);

    expect(screen.getByText("Test Game")).toBeInTheDocument();
    expect(
      screen.getByText("This is a test game description"),
    ).toBeInTheDocument();
  });

  it("renders link with correct href", () => {
    const { container } = render(<GameTile game={mockGame} />);

    const link = container.querySelector("a");
    expect(link).toHaveAttribute("href", "/games/test-game");
  });

  it("renders image with correct alt text", () => {
    render(<GameTile game={mockGame} />);

    const img = screen.getByAltText("Test Game game thumbnail");
    expect(img).toBeInTheDocument();
  });

  it("shows scoreboard badge when hasScoreboard is true", () => {
    render(<GameTile game={mockGame} />);

    expect(screen.getByText("Scoreboard")).toBeInTheDocument();
  });

  it("does not show scoreboard badge when hasScoreboard is false", () => {
    const gameWithoutScoreboard = { ...mockGame, hasScoreboard: false };
    render(<GameTile game={gameWithoutScoreboard} />);

    expect(screen.queryByText("Scoreboard")).not.toBeInTheDocument();
  });

  it("renders up to 3 tags", () => {
    render(<GameTile game={mockGame} />);

    expect(screen.getByText("test")).toBeInTheDocument();
    expect(screen.getByText("puzzle")).toBeInTheDocument();
    expect(screen.getByText("fun")).toBeInTheDocument();
  });

  it("limits displayed tags to 3", () => {
    const gameWithManyTags = {
      ...mockGame,
      tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
    };
    render(<GameTile game={gameWithManyTags} />);

    // Should only show first 3 tags
    expect(screen.getByText("tag1")).toBeInTheDocument();
    expect(screen.getByText("tag2")).toBeInTheDocument();
    expect(screen.getByText("tag3")).toBeInTheDocument();
    expect(screen.queryByText("tag4")).not.toBeInTheDocument();
    expect(screen.queryByText("tag5")).not.toBeInTheDocument();
  });

  it("has focus outline for accessibility", () => {
    const { container } = render(<GameTile game={mockGame} />);

    const link = container.querySelector("a");
    expect(link).toHaveClass(
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-purple-500",
    );
  });

  it("renders Spanish tag and scoreboard label when language is Spanish", () => {
    translationEngine.changeLanguage("es");
    render(<GameTile game={mockGame} />);

    expect(screen.getByText("rompecabezas")).toBeInTheDocument();
    expect(screen.getByText("Tabla de puntuaciones")).toBeInTheDocument();
  });
});
