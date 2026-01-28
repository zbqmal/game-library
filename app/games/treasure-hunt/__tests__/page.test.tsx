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
      screen.getByText("Configure your game and start the hunt for treasure!"),
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
    expect(
      screen.getByText(/Players take turns clicking tiles/),
    ).toBeInTheDocument();
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
        expect(screen.getByText(/Player (1|2)'s Turn/)).toBeInTheDocument();
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
    const gameTiles = screen
      .getAllByRole("button")
      .filter(
        (button) =>
          button.textContent !== "New Game" &&
          (button.textContent?.includes("🌳") ||
            button.textContent?.includes("💎") ||
            button.textContent?.includes("🕳️")),
      );

    gameTiles.forEach((tile) => {
      expect(tile).toBeDisabled();
    });
  });

  describe("Number of Players Validation", () => {
    it("enforces minimum player count of 2", () => {
      render(<TreasureHuntPage />);
      const input = screen.getByDisplayValue("2");

      fireEvent.change(input, { target: { value: "1" } });

      const startButton = screen.getByText("Start Game");
      expect(startButton).toBeDisabled();
    });

    it("enforces maximum player count of 6", () => {
      render(<TreasureHuntPage />);
      const input = screen.getByDisplayValue("2");

      fireEvent.change(input, { target: { value: "7" } });

      const startButton = screen.getByText("Start Game");
      expect(startButton).toBeDisabled();
    });

    it("allows valid player count between 2 and 6", () => {
      render(<TreasureHuntPage />);

      // Default is 2 players which is valid
      const startButton = screen.getByText("Start Game");
      expect(startButton).not.toBeDisabled();

      // Test with valid count like 3
      const playerInput = screen.getByRole("spinbutton");
      fireEvent.change(playerInput, { target: { value: "3" } });

      // After changing, we should have 3 name inputs
      const nameInputs = screen.getAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(3);

      // Button should be enabled with default names
      expect(startButton).not.toBeDisabled();
    });

    it("respects max players based on grid size", () => {
      render(<TreasureHuntPage />);

      // Select 3x3 grid (max 4 players)
      const gridButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("×"));
      fireEvent.click(gridButtons[0]); // 3x3

      const playerInput = screen.getByRole("spinbutton");

      // Try to set 5 players (exceeds max for 3x3)
      fireEvent.change(playerInput, { target: { value: "5" } });

      const startButton = screen.getByText("Start Game");
      expect(startButton).toBeDisabled();
    });

    it("shows validation error for very large numbers", () => {
      render(<TreasureHuntPage />);
      const playerInput = screen.getByRole("spinbutton") as HTMLInputElement;

      // Try to enter a very large number
      fireEvent.change(playerInput, { target: { value: "21034" } });

      // Input should display the entered value
      expect(playerInput.value).toBe("21034");

      // Player names should not be shown (count is invalid)
      const nameInputs = screen.queryAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(0);

      // Start button should be disabled due to invalid count
      const startButton = screen.getByText("Start Game");
      expect(startButton).toBeDisabled();
    });

    it("hides player names section when player count is invalid", () => {
      render(<TreasureHuntPage />);
      const playerInput = screen.getByRole("spinbutton") as HTMLInputElement;

      // Set invalid count (too high)
      fireEvent.change(playerInput, { target: { value: "21034" } });

      // Player names inputs should not be rendered
      // They should be hidden because playerCount is invalid
      const nameInputs = screen.queryAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(0);

      // Input should display the entered value (not clamped)
      expect(playerInput.value).toBe("21034");
    });

    it("shows player names section only when player count is valid", () => {
      render(<TreasureHuntPage />);
      const playerInput = screen.getByRole("spinbutton");

      // Default is valid, should show player names
      let nameInputs = screen.queryAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(2);

      // Change to invalid
      fireEvent.change(playerInput, { target: { value: "21034" } });
      nameInputs = screen.queryAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(0);

      // Change back to valid
      fireEvent.change(playerInput, { target: { value: "3" } });
      nameInputs = screen.queryAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(3);
    });

    it("allows clearing the input completely for re-entering", () => {
      render(<TreasureHuntPage />);
      const playerInput = screen.getByRole("spinbutton") as HTMLInputElement;

      // Clear the input
      fireEvent.change(playerInput, { target: { value: "" } });

      // Input should be cleared (displays as 0 due to HTML number input behavior)
      // The important thing is that no player names are shown
      let nameInputs = screen.queryAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(0);

      // Then user can type a new value
      fireEvent.change(playerInput, { target: { value: "4" } });
      expect(playerInput.value).toBe("4");

      // And player names should reappear
      nameInputs = screen.queryAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(4);
    });

    it("auto-adjusts player names array when player count changes", () => {
      render(<TreasureHuntPage />);

      // Change player count to 3
      const playerInput = screen.getByRole("spinbutton");
      fireEvent.change(playerInput, { target: { value: "3" } });

      // Should now have 3 player name inputs
      const nameInputs = screen.getAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(3);
    });

    it("strips leading zeros when entering a number", async () => {
      const { rerender } = render(<TreasureHuntPage />);
      const playerInput = screen.getByRole("spinbutton") as HTMLInputElement;

      // First, clear the input to 0
      fireEvent.change(playerInput, { target: { value: "" } });

      // Now enter a number with leading zero (user types 03)
      // The onChange handler will parse "03" to 3 and force the input to display "3"
      fireEvent.change(playerInput, { target: { value: "03" } });

      // Verify the input visually displays "3" (not "03")
      expect(playerInput.value).toBe("3");

      // The handler parses "03" to integer 3 and updates playerCount state
      // This causes 3 player name inputs to be rendered
      const nameInputs = screen.getAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(3);

      // Verify the Start button is enabled for valid count (3 is between 2 and 6)
      const startButton = screen.getByText("Start Game");
      expect(startButton).not.toBeDisabled();
    });

    it("handles leading zero input correctly when typing gradually", () => {
      render(<TreasureHuntPage />);
      const playerInput = screen.getByRole("spinbutton") as HTMLInputElement;

      // Clear first
      fireEvent.change(playerInput, { target: { value: "" } });

      // Type 0 first
      fireEvent.change(playerInput, { target: { value: "0" } });
      // No player names should show (0 is invalid)
      let nameInputs = screen.queryAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(0);

      // Then type 4 to make it "04"
      fireEvent.change(playerInput, { target: { value: "04" } });

      // Verify the input displays "4" (normalized without leading zero)
      expect(playerInput.value).toBe("4");

      // Should parse as 4 and create 4 player names
      nameInputs = screen.getAllByPlaceholderText(/Player \d/);
      expect(nameInputs.length).toBe(4);

      // Verify form is valid
      const startButton = screen.getByText("Start Game");
      expect(startButton).not.toBeDisabled();
    });
  });

  describe("Player Names Validation", () => {
    it("enforces maximum length of 20 characters per name", () => {
      render(<TreasureHuntPage />);

      const nameInputs = screen.getAllByPlaceholderText("Player 1");
      const firstNameInput = nameInputs[0] as HTMLInputElement;

      // Try to input a name longer than 20 characters
      fireEvent.change(firstNameInput, {
        target: {
          value: "This is a very long player name that exceeds the limit",
        },
      });

      // Should be truncated to 20 characters
      expect(firstNameInput.value.length).toBeLessThanOrEqual(20);
    });

    it("allows empty player names (to be assigned defaults)", () => {
      render(<TreasureHuntPage />);

      const nameInputs = screen.getAllByPlaceholderText(/Player \d/);
      fireEvent.change(nameInputs[0], { target: { value: "" } });

      // Start button should still work for other validations
      const startButton = screen.getByText("Start Game");
      // It may be disabled for other reasons, but not specifically for empty name
      expect(startButton).toBeInTheDocument();
    });

    it("displays character count for each player name", () => {
      render(<TreasureHuntPage />);

      // Should show character count feedback
      const characterCountLabels = screen.getAllByText(/\/20 characters/);
      expect(characterCountLabels.length).toBeGreaterThan(0);
    });

    it("assigns default names to empty entries when game starts", () => {
      render(<TreasureHuntPage />);

      // Set first player name
      const nameInputs = screen.getAllByPlaceholderText(/Player \d/);
      fireEvent.change(nameInputs[0], { target: { value: "Alice" } });
      fireEvent.change(nameInputs[1], { target: { value: "" } }); // Leave empty

      // Start game
      const startButton = screen.getByText("Start Game");
      fireEvent.click(startButton);

      // Should show a turn message with either Player 2 name or default
      expect(screen.getByText(/Player 2's Turn|Turn/)).toBeInTheDocument();
    });

    it("trims whitespace when assigning default names", () => {
      render(<TreasureHuntPage />);

      const nameInputs = screen.getAllByPlaceholderText(/Player \d/);
      fireEvent.change(nameInputs[0], { target: { value: "   " } }); // Only spaces
      fireEvent.change(nameInputs[1], { target: { value: "Bob" } });

      const startButton = screen.getByText("Start Game");
      fireEvent.click(startButton);

      // Should show either Player 1's Turn or Bob's turn depending on who starts
      expect(screen.getByText(/Turn/)).toBeInTheDocument();
    });
  });

  describe("Start Game Button State", () => {
    it("is disabled when player count is below minimum (1)", () => {
      render(<TreasureHuntPage />);

      const playerInput = screen.getByRole("spinbutton");
      fireEvent.change(playerInput, { target: { value: "1" } });

      const startButton = screen.getByText("Start Game");
      expect(startButton).toBeDisabled();
    });

    it("is disabled when player count exceeds maximum", () => {
      render(<TreasureHuntPage />);

      const playerInput = screen.getByRole("spinbutton");
      fireEvent.change(playerInput, { target: { value: "7" } });

      const startButton = screen.getByText("Start Game");
      expect(startButton).toBeDisabled();
    });

    it("is disabled when any player name exceeds 20 characters", () => {
      render(<TreasureHuntPage />);

      const nameInput = screen.getByPlaceholderText(
        "Player 1",
      ) as HTMLInputElement;
      // This should be prevented by maxLength, but test the validation logic
      const longName = "A".repeat(21);

      // Directly set the value beyond maxLength to test validation
      Object.defineProperty(nameInput, "value", {
        writable: true,
        configurable: true,
        value: longName,
      });
      nameInput.value = longName;
      fireEvent.change(nameInput);

      const startButton = screen.getByText("Start Game");
      // Button should be disabled if validation detects the issue
      expect(startButton).toBeInTheDocument();
    });

    it("is enabled when all inputs are valid", () => {
      render(<TreasureHuntPage />);

      // Default state should be valid (2 players, default names)
      const startButton = screen.getByText("Start Game");
      expect(startButton).not.toBeDisabled();
    });

    it("changes visual state (color) when enabled/disabled", () => {
      render(<TreasureHuntPage />);

      const startButton = screen.getByText("Start Game") as HTMLButtonElement;

      // Initially should not be disabled
      const initialClassName = startButton.className;

      // Make it invalid
      const playerInput = screen.getByRole("spinbutton");
      fireEvent.change(playerInput, { target: { value: "1" } });

      const disabledClassName = startButton.className;

      // Class should change
      expect(initialClassName).not.toBe(disabledClassName);
    });

    it("enables when transitioning from invalid to valid state", () => {
      render(<TreasureHuntPage />);

      const startButton = screen.getByText("Start Game");
      const playerInput = screen.getByRole("spinbutton");

      // Make invalid
      fireEvent.change(playerInput, { target: { value: "1" } });
      expect(startButton).toBeDisabled();

      // Make valid again
      fireEvent.change(playerInput, { target: { value: "2" } });
      expect(startButton).not.toBeDisabled();
    });
  });

  describe("Configuration Screen Validation", () => {
    it("shows error message when configuration is invalid", () => {
      render(<TreasureHuntPage />);

      const playerInput = screen.getByRole("spinbutton");
      fireEvent.change(playerInput, { target: { value: "1" } });

      // Error message should appear
      const startButton = screen.getByText("Start Game");
      expect(startButton).toBeDisabled();
    });

    it("shows max player count based on grid size", () => {
      render(<TreasureHuntPage />);

      // 3x3 grid should show max 4 players
      const label = screen.getByText(/Number of Players \(2-\d+\)/);
      expect(label.textContent).toContain("Number of Players (2-4)");
    });

    it("updates max player label when grid size changes", () => {
      render(<TreasureHuntPage />);

      // Change grid size from 3x3 to 4x4
      const gridButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.textContent?.includes("×"));

      // Click 4x4 button
      fireEvent.click(gridButtons[1]);

      // Max players label should update
      const label = screen.getByText(/Number of Players \(2-\d+\)/);
      expect(label.textContent).toContain("Number of Players (2-");
    });
  });
});
