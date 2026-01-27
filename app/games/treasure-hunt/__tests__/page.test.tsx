import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import TreasureHuntPage from "../page";

// Mock the GameShell component
jest.mock("@/app/components/common/GameShell", () => {
  return function MockGameShell({
    children,
    title,
    description,
  }: {
    children: React.ReactNode;
    title: string;
    description: string;
  }) {
    return (
      <div data-testid="game-shell">
        <h1>{title}</h1>
        <p>{description}</p>
        {children}
      </div>
    );
  };
});

describe("TreasureHuntPage", () => {
  // Helper function to start a game with default configuration
  const startGame = () => {
    const startButton = screen.getByText("Start Game");
    fireEvent.click(startButton);
  };

  it("renders the game title and configuration screen", () => {
    render(<TreasureHuntPage />);

    expect(screen.getByText("Treasure Hunt")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Configure your game and start the hunt for treasure!",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Start Game")).toBeInTheDocument();
  });

  it("renders 9 tiles after starting game", () => {
    render(<TreasureHuntPage />);
    startGame();

    const tiles = screen.getAllByRole("button").filter((button) => {
      return button.textContent?.includes("🌳");
    });

    expect(tiles.length).toBe(9);
  });

  it("displays Player 1's turn initially after starting game", () => {
    render(<TreasureHuntPage />);
    startGame();

    expect(screen.getByText("Player 1's Turn")).toBeInTheDocument();
  });

  it("displays game rules", () => {
    render(<TreasureHuntPage />);

    expect(screen.getByText("Game Rules:")).toBeInTheDocument();
    expect(screen.getByText(/Players take turns clicking tiles/)).toBeInTheDocument();
  });

  it("uncovers a tile when clicked", () => {
    render(<TreasureHuntPage />);
    startGame();

    const tiles = screen.getAllByRole("button").filter((button) => {
      return button.textContent?.includes("🌳");
    });

    // Click the first tile
    fireEvent.click(tiles[0]);

    // The tile should now be uncovered (either empty or treasure)
    const updatedTiles = screen.getAllByRole("button").filter((button) => {
      return button.textContent?.includes("🌳");
    });

    // One less covered tile
    expect(updatedTiles.length).toBe(8);
  });

  it("switches player turn after uncovering a non-treasure tile", () => {
    render(<TreasureHuntPage />);
    startGame();

    const tiles = screen.getAllByRole("button");

    // Click tiles until we find one that's not the treasure
    for (let i = 0; i < 9; i++) {
      fireEvent.click(tiles[i]);

      // If game is not over, player should have switched
      if (!screen.queryByText(/Wins!/)) {
        expect(
          screen.getByText(/Player (1|2)'s Turn/),
        ).toBeInTheDocument();
        break;
      }
    }
  });

  it("displays winner when treasure is found", () => {
    render(<TreasureHuntPage />);
    startGame();

    const tiles = screen.getAllByRole("button");

    // Click all tiles to eventually find treasure
    for (let i = 0; i < tiles.length; i++) {
      fireEvent.click(tiles[i]);

      // Check if winner is displayed
      if (screen.queryByText(/Wins!/)) {
        expect(screen.getByText(/Player (1|2) Wins!/)).toBeInTheDocument();
        break;
      }
    }
  });

  it("displays treasure emoji when found", () => {
    render(<TreasureHuntPage />);
    startGame();

    const tiles = screen.getAllByRole("button");

    // Click all tiles to find treasure
    for (let i = 0; i < tiles.length; i++) {
      fireEvent.click(tiles[i]);
    }

    // At least one tile should show the treasure
    expect(screen.getByText("💎")).toBeInTheDocument();
  });

  it("shows New Game button when game is over", () => {
    render(<TreasureHuntPage />);
    startGame();

    const tiles = screen.getAllByRole("button");

    // Click all tiles to end game
    for (let i = 0; i < tiles.length; i++) {
      fireEvent.click(tiles[i]);
    }

    expect(screen.getByText("New Game")).toBeInTheDocument();
  });

  it("resets game when New Game is clicked", () => {
    render(<TreasureHuntPage />);
    startGame();

    const tiles = screen.getAllByRole("button");

    // Click all tiles to end game
    for (let i = 0; i < tiles.length; i++) {
      fireEvent.click(tiles[i]);
    }

    // Click New Game
    const newGameButton = screen.getByText("New Game");
    fireEvent.click(newGameButton);

    // Should go back to configuration screen
    expect(screen.getByText("Start Game")).toBeInTheDocument();
    expect(screen.getByText("Game Configuration")).toBeInTheDocument();
  });

  it("prevents clicking on already uncovered tiles", () => {
    render(<TreasureHuntPage />);
    startGame();

    const tiles = screen.getAllByRole("button");

    // Click first tile
    fireEvent.click(tiles[0]);

    // Get current player
    const currentPlayerText = screen.queryByText(/Player (1|2)'s Turn/);
    const currentPlayer = currentPlayerText?.textContent;

    // Try clicking the same tile again
    fireEvent.click(tiles[0]);

    // Player should not have changed (unless game ended)
    if (!screen.queryByText(/Wins!/) && currentPlayer) {
      expect(screen.getByText(currentPlayer)).toBeInTheDocument();
    }
  });

  it("disables all tiles when game is over", () => {
    render(<TreasureHuntPage />);
    startGame();

    const tiles = screen.getAllByRole("button");

    // Click all tiles to end game
    for (let i = 0; i < tiles.length; i++) {
      fireEvent.click(tiles[i]);
    }

    // All game tiles should be disabled (get only the grid tiles, not New Game button)
    const gameTiles = screen.getAllByRole("button").filter(
      (button) => button.textContent !== "New Game" && (
        button.textContent?.includes("🌳") ||
        button.textContent?.includes("💎") ||
        button.textContent?.includes("🕳️")
      ),
    );
    
    gameTiles.forEach((tile) => {
      expect(tile).toBeDisabled();
    });
  });
});
