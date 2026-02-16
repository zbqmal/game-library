import {
  initializeGame,
  uncoverTile,
  GameState,
  TileState,
  validatePlayerCount,
  validateGridSize,
  validateGameConfig,
  validatePlayerName,
  validatePlayerNames,
  getDefaultPlayerName,
  normalizePlayerNames,
  GameConfig,
} from "../gameLogic";

describe("Treasure Hunt Game Logic", () => {
  describe("validateGridSize", () => {
    it("returns true for valid grid sizes (3-6)", () => {
      expect(validateGridSize(3)).toBe(true);
      expect(validateGridSize(4)).toBe(true);
      expect(validateGridSize(5)).toBe(true);
      expect(validateGridSize(6)).toBe(true);
    });

    it("returns false for grid size below minimum (< 3)", () => {
      expect(validateGridSize(2)).toBe(false);
      expect(validateGridSize(1)).toBe(false);
      expect(validateGridSize(0)).toBe(false);
      expect(validateGridSize(-1)).toBe(false);
    });

    it("returns false for grid size above maximum (> 6)", () => {
      expect(validateGridSize(7)).toBe(false);
      expect(validateGridSize(10)).toBe(false);
      expect(validateGridSize(100)).toBe(false);
    });
  });

  describe("validatePlayerCount", () => {
    it("returns true for valid player count (2-6, within half tiles limit)", () => {
      expect(validatePlayerCount(2, 9)).toBe(true);
      expect(validatePlayerCount(3, 9)).toBe(true);
      expect(validatePlayerCount(4, 9)).toBe(true);
      expect(validatePlayerCount(4, 16)).toBe(true);
      expect(validatePlayerCount(6, 36)).toBe(true);
    });

    it("returns false for player count below minimum (< 2)", () => {
      expect(validatePlayerCount(1, 9)).toBe(false);
      expect(validatePlayerCount(0, 9)).toBe(false);
      expect(validatePlayerCount(-1, 9)).toBe(false);
    });

    it("returns false for player count exceeding half of tiles", () => {
      expect(validatePlayerCount(5, 9)).toBe(false); // 5 > 9/2
      expect(validatePlayerCount(6, 9)).toBe(false); // 6 > 9/2
      expect(validatePlayerCount(9, 16)).toBe(false); // 9 > 16/2
    });

    it("returns false for player count above absolute maximum (> 6)", () => {
      expect(validatePlayerCount(7, 36)).toBe(false);
      expect(validatePlayerCount(10, 36)).toBe(false);
    });

    it("handles edge case: exactly half of tiles", () => {
      expect(validatePlayerCount(4, 9)).toBe(true); // 4 < 9/2 = 4.5
      expect(validatePlayerCount(5, 9)).toBe(false); // 5 > 9/2 = 4.5
    });
  });

  describe("validateGameConfig", () => {
    it("returns valid for correct configuration", () => {
      const config: GameConfig = {
        playerCount: 2,
        playerNames: ["Alice", "Bob"],
        gridSize: 3,
      };
      const result = validateGameConfig(config);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("returns error for invalid grid size", () => {
      const config: GameConfig = {
        playerCount: 2,
        playerNames: ["Alice", "Bob"],
        gridSize: 2,
      };
      const result = validateGameConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Grid size must be between 3 and 6");
    });

    it("returns error for too many players", () => {
      const config: GameConfig = {
        playerCount: 5,
        playerNames: ["A", "B", "C", "D", "E"],
        gridSize: 3, // 3x3 grid, max 4 players
      };
      const result = validateGameConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Maximum 4 players allowed for 3×3 grid");
    });

    it("returns error for mismatched player names count", () => {
      const config: GameConfig = {
        playerCount: 3,
        playerNames: ["Alice", "Bob"], // Only 2 names for 3 players
        gridSize: 3,
      };
      const result = validateGameConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toBe(
        "Number of player names must match player count",
      );
    });

    it("validates max players for different grid sizes", () => {
      // 3x3 = 9 tiles, max 4 players
      expect(
        validateGameConfig({
          playerCount: 4,
          playerNames: ["A", "B", "C", "D"],
          gridSize: 3,
        }).valid,
      ).toBe(true);

      // 4x4 = 16 tiles, max 6 players (absolute max)
      expect(
        validateGameConfig({
          playerCount: 6,
          playerNames: ["A", "B", "C", "D", "E", "F"],
          gridSize: 4,
        }).valid,
      ).toBe(true);

      // 6x6 = 36 tiles, max 6 players (absolute max)
      expect(
        validateGameConfig({
          playerCount: 6,
          playerNames: ["A", "B", "C", "D", "E", "F"],
          gridSize: 6,
        }).valid,
      ).toBe(true);
    });
  });

  describe("validatePlayerName", () => {
    it("returns true for names within maximum length (20 characters)", () => {
      expect(validatePlayerName("Alice")).toBe(true);
      expect(validatePlayerName("Bob")).toBe(true);
      expect(validatePlayerName("A")).toBe(true);
      expect(validatePlayerName("VeryLongPlayerName123")).toBe(false); // 21 chars
      expect(validatePlayerName("VeryLongPlayerName12")).toBe(true); // 20 chars (max)
    });

    it("returns false for names exceeding maximum length", () => {
      expect(validatePlayerName("This is a very long player name")).toBe(false);
      expect(validatePlayerName("X".repeat(21))).toBe(false);
    });

    it("allows empty strings", () => {
      expect(validatePlayerName("")).toBe(true);
    });

    it("allows names with special characters within limit", () => {
      expect(validatePlayerName("Player@123")).toBe(true);
      expect(validatePlayerName("Jane-Doe")).toBe(true);
      expect(validatePlayerName("Player_#1")).toBe(true);
    });

    it("allows whitespace within limit", () => {
      expect(validatePlayerName("Player One")).toBe(true);
      expect(validatePlayerName("John Doe Player")).toBe(true);
    });
  });

  describe("validatePlayerNames", () => {
    it("returns true when all names are valid", () => {
      expect(validatePlayerNames(["Alice", "Bob"])).toBe(true);
      expect(validatePlayerNames(["P1", "P2", "P3"])).toBe(true);
      expect(validatePlayerNames(["A", ""])).toBe(true); // Empty is valid
    });

    it("returns false when any name exceeds maximum length", () => {
      expect(validatePlayerNames(["Alice", "VeryLongPlayerName123"])).toBe(
        false,
      );
      expect(validatePlayerNames(["X".repeat(21)])).toBe(false);
    });

    it("returns true for empty array", () => {
      expect(validatePlayerNames([])).toBe(true);
    });

    it("returns true for single name", () => {
      expect(validatePlayerNames(["Player"])).toBe(true);
    });

    it("returns true for array with six names (maximum)", () => {
      expect(validatePlayerNames(["P1", "P2", "P3", "P4", "P5", "P6"])).toBe(
        true,
      );
    });

    it("returns false if any of many names is invalid", () => {
      expect(
        validatePlayerNames(["P1", "P2", "P3", "X".repeat(21), "P5", "P6"]),
      ).toBe(false);
    });
  });

  describe("getDefaultPlayerName", () => {
    it("returns correct default name for given index", () => {
      expect(getDefaultPlayerName(0)).toBe("Player 1");
      expect(getDefaultPlayerName(1)).toBe("Player 2");
      expect(getDefaultPlayerName(2)).toBe("Player 3");
      expect(getDefaultPlayerName(5)).toBe("Player 6");
    });

    it("works for any positive index", () => {
      expect(getDefaultPlayerName(10)).toBe("Player 11");
      expect(getDefaultPlayerName(99)).toBe("Player 100");
    });
  });

  describe("normalizePlayerNames", () => {
    it("assigns default names to empty strings", () => {
      const result = normalizePlayerNames(["", ""]);
      expect(result).toEqual(["Player 1", "Player 2"]);
    });

    it("preserves non-empty names", () => {
      const result = normalizePlayerNames(["Alice", "Bob"]);
      expect(result).toEqual(["Alice", "Bob"]);
    });

    it("assigns defaults only to empty names", () => {
      const result = normalizePlayerNames(["Alice", "", "Charlie"]);
      expect(result).toEqual(["Alice", "Player 2", "Charlie"]);
    });

    it("handles names with only whitespace", () => {
      const result = normalizePlayerNames(["Alice", "   ", "Charlie"]);
      expect(result).toEqual(["Alice", "Player 2", "Charlie"]);
    });

    it("preserves tab and newline as whitespace", () => {
      const result = normalizePlayerNames(["\t", "\n", "Valid"]);
      expect(result).toEqual(["Player 1", "Player 2", "Valid"]);
    });

    it("works with six players", () => {
      const result = normalizePlayerNames(["", "Bob", "", "Dave", "", ""]);
      expect(result).toEqual([
        "Player 1",
        "Bob",
        "Player 3",
        "Dave",
        "Player 5",
        "Player 6",
      ]);
    });

    it("handles all empty array", () => {
      const result = normalizePlayerNames(Array(4).fill(""));
      expect(result).toEqual(["Player 1", "Player 2", "Player 3", "Player 4"]);
    });

    it("returns new array without mutating input", () => {
      const original = ["Alice", "", "Charlie"];
      const result = normalizePlayerNames(original);

      expect(original).toEqual(["Alice", "", "Charlie"]);
      expect(result).toEqual(["Alice", "Player 2", "Charlie"]);
      expect(result).not.toBe(original);
    });
  });

  describe("initializeGame", () => {
    it("returns initial game state with correct structure", () => {
      const state = initializeGame();

      expect(state).toHaveProperty("tiles");
      expect(state).toHaveProperty("treasurePosition");
      expect(state).toHaveProperty("currentPlayer");
      expect(state).toHaveProperty("winner");
      expect(state).toHaveProperty("isGameOver");
      expect(state).toHaveProperty("playerCount");
      expect(state).toHaveProperty("playerNames");
      expect(state).toHaveProperty("gridSize");
    });

    it("initializes with default 2 players and 3x3 grid when no config provided", () => {
      const state = initializeGame();

      expect(state.tiles).toHaveLength(9);
      expect(state.playerCount).toBe(2);
      expect(state.playerNames).toEqual(["Player 1", "Player 2"]);
      expect(state.gridSize).toBe(3);
      expect(state.tiles.every((tile) => tile === "covered")).toBe(true);
    });

    it("accepts custom configuration with player count and names", () => {
      const config: GameConfig = {
        playerCount: 3,
        playerNames: ["Alice", "Bob", "Charlie"],
        gridSize: 4,
      };
      const state = initializeGame(config);

      expect(state.playerCount).toBe(3);
      expect(state.playerNames).toEqual(["Alice", "Bob", "Charlie"]);
      expect(state.gridSize).toBe(4);
      expect(state.tiles).toHaveLength(16);
    });

    it("creates correct number of tiles for different grid sizes", () => {
      const config3x3: GameConfig = {
        playerCount: 2,
        playerNames: ["P1", "P2"],
        gridSize: 3,
      };
      expect(initializeGame(config3x3).tiles).toHaveLength(9);

      const config4x4: GameConfig = {
        playerCount: 3,
        playerNames: ["P1", "P2", "P3"],
        gridSize: 4,
      };
      expect(initializeGame(config4x4).tiles).toHaveLength(16);

      const config6x6: GameConfig = {
        playerCount: 6,
        playerNames: ["P1", "P2", "P3", "P4", "P5", "P6"],
        gridSize: 6,
      };
      expect(initializeGame(config6x6).tiles).toHaveLength(36);
    });

    it("throws error for invalid configuration", () => {
      const invalidConfig: GameConfig = {
        playerCount: 10, // Too many players
        playerNames: Array(10).fill("Player"),
        gridSize: 3,
      };

      expect(() => initializeGame(invalidConfig)).toThrow();
    });

    it("throws error for grid size below minimum", () => {
      const invalidConfig: GameConfig = {
        playerCount: 1,
        playerNames: ["Player 1"],
        gridSize: 2, // Below minimum
      };

      expect(() => initializeGame(invalidConfig)).toThrow(
        "Grid size must be between 3 and 6",
      );
    });

    it("throws error for player count exceeding half of tiles", () => {
      const invalidConfig: GameConfig = {
        playerCount: 5, // More than 9/2 = 4.5
        playerNames: ["P1", "P2", "P3", "P4", "P5"],
        gridSize: 3,
      };

      expect(() => initializeGame(invalidConfig)).toThrow();
    });

    it("initializes with 9 covered tiles", () => {
      const state = initializeGame();

      expect(state.tiles).toHaveLength(9);
      expect(state.tiles.every((tile) => tile === "covered")).toBe(true);
    });

    it("sets treasure position between 0 and 8", () => {
      const state = initializeGame();

      expect(state.treasurePosition).toBeGreaterThanOrEqual(0);
      expect(state.treasurePosition).toBeLessThanOrEqual(8);
    });

    it("sets treasure position within bounds for different grid sizes", () => {
      const config4x4: GameConfig = {
        playerCount: 2,
        playerNames: ["P1", "P2"],
        gridSize: 4,
      };
      const state4x4 = initializeGame(config4x4);
      expect(state4x4.treasurePosition).toBeGreaterThanOrEqual(0);
      expect(state4x4.treasurePosition).toBeLessThanOrEqual(15);

      const config6x6: GameConfig = {
        playerCount: 3,
        playerNames: ["P1", "P2", "P3"],
        gridSize: 6,
      };
      const state6x6 = initializeGame(config6x6);
      expect(state6x6.treasurePosition).toBeGreaterThanOrEqual(0);
      expect(state6x6.treasurePosition).toBeLessThanOrEqual(35);
    });

    it("starts with player 1", () => {
      const state = initializeGame();

      expect(state.currentPlayer).toBe(1);
    });

    it("has no winner initially", () => {
      const state = initializeGame();

      expect(state.winner).toBeNull();
    });

    it("is not game over initially", () => {
      const state = initializeGame();

      expect(state.isGameOver).toBe(false);
    });

    it("returns different treasure positions over multiple calls", () => {
      const positions = new Set<number>();

      // Generate 100 games to ensure randomness
      for (let i = 0; i < 100; i++) {
        const state = initializeGame();
        positions.add(state.treasurePosition);
      }

      // Should have at least 5 different positions (statistically very likely)
      expect(positions.size).toBeGreaterThanOrEqual(5);
    });

    it("returns a new object each time", () => {
      const state1 = initializeGame();
      const state2 = initializeGame();

      expect(state1).not.toBe(state2);
    });
  });

  describe("uncoverTile", () => {
    let initialState: GameState;

    beforeEach(() => {
      // Create a predictable state for testing
      initialState = {
        tiles: Array(9).fill("covered"),
        treasurePosition: 4, // Middle tile
        currentPlayer: 1,
        winner: null,
        isGameOver: false,
        playerCount: 2,
        playerNames: ["Player 1", "Player 2"],
        gridSize: 3,
      };
    });

    it("does not mutate the original state", () => {
      const stateCopy = JSON.parse(JSON.stringify(initialState));

      uncoverTile(initialState, 0);

      expect(initialState).toEqual(stateCopy);
    });

    it("returns a new state object", () => {
      const newState = uncoverTile(initialState, 0);

      expect(newState).not.toBe(initialState);
    });

    describe("when uncovering an empty tile", () => {
      it("marks tile as uncovered-empty", () => {
        const newState = uncoverTile(initialState, 0);

        expect(newState.tiles[0]).toBe("uncovered-empty");
      });

      it("switches to next player", () => {
        const newState = uncoverTile(initialState, 0);

        expect(newState.currentPlayer).toBe(2);
      });

      it("does not end the game", () => {
        const newState = uncoverTile(initialState, 0);

        expect(newState.isGameOver).toBe(false);
        expect(newState.winner).toBeNull();
      });

      it("switches from player 2 to player 1", () => {
        const state = { ...initialState, currentPlayer: 2 as const };
        const newState = uncoverTile(state, 0);

        expect(newState.currentPlayer).toBe(1);
      });
    });

    describe("when uncovering the treasure tile", () => {
      it("marks tile as uncovered-treasure", () => {
        const newState = uncoverTile(initialState, 4);

        expect(newState.tiles[4]).toBe("uncovered-treasure");
      });

      it("sets current player as winner", () => {
        const newState = uncoverTile(initialState, 4);

        expect(newState.winner).toBe(1);
      });

      it("ends the game", () => {
        const newState = uncoverTile(initialState, 4);

        expect(newState.isGameOver).toBe(true);
      });

      it("sets player 2 as winner when it's their turn", () => {
        const state = { ...initialState, currentPlayer: 2 as const };
        const newState = uncoverTile(state, 4);

        expect(newState.winner).toBe(2);
        expect(newState.isGameOver).toBe(true);
      });
    });

    describe("when tile is already uncovered", () => {
      it("returns the same state without changes", () => {
        const stateWithUncovered = {
          ...initialState,
          tiles: [
            "uncovered-empty",
            "covered",
            "covered",
            "covered",
            "covered",
            "covered",
            "covered",
            "covered",
            "covered",
          ] as TileState[],
        };

        const newState = uncoverTile(stateWithUncovered, 0);

        expect(newState).toEqual(stateWithUncovered);
      });

      it("does not switch players", () => {
        const stateWithUncovered = {
          ...initialState,
          tiles: [
            "uncovered-empty",
            "covered",
            "covered",
            "covered",
            "covered",
            "covered",
            "covered",
            "covered",
            "covered",
          ] as TileState[],
        };

        const newState = uncoverTile(stateWithUncovered, 0);

        expect(newState.currentPlayer).toBe(1);
      });
    });

    describe("when game is over", () => {
      it("returns the same state without changes", () => {
        const gameOverState = {
          ...initialState,
          isGameOver: true,
          winner: 1 as const,
        };

        const newState = uncoverTile(gameOverState, 0);

        expect(newState).toEqual(gameOverState);
      });
    });

    describe("edge cases", () => {
      it("handles uncovering first tile (index 0)", () => {
        const state = { ...initialState, treasurePosition: 0 };
        const newState = uncoverTile(state, 0);

        expect(newState.tiles[0]).toBe("uncovered-treasure");
        expect(newState.winner).toBe(1);
      });

      it("handles uncovering last tile (index 8)", () => {
        const state = { ...initialState, treasurePosition: 8 };
        const newState = uncoverTile(state, 8);

        expect(newState.tiles[8]).toBe("uncovered-treasure");
        expect(newState.winner).toBe(1);
      });

      it("preserves other tiles when uncovering one", () => {
        const newState = uncoverTile(initialState, 0);

        for (let i = 1; i < 9; i++) {
          expect(newState.tiles[i]).toBe("covered");
        }
      });
    });

    describe("game flow scenario", () => {
      it("allows multiple players to take turns", () => {
        let state = initialState;

        // Player 1 uncovers tile 0 (empty)
        state = uncoverTile(state, 0);
        expect(state.currentPlayer).toBe(2);
        expect(state.tiles[0]).toBe("uncovered-empty");

        // Player 2 uncovers tile 1 (empty)
        state = uncoverTile(state, 1);
        expect(state.currentPlayer).toBe(1);
        expect(state.tiles[1]).toBe("uncovered-empty");

        // Player 1 uncovers tile 4 (treasure)
        state = uncoverTile(state, 4);
        expect(state.winner).toBe(1);
        expect(state.isGameOver).toBe(true);
        expect(state.tiles[4]).toBe("uncovered-treasure");
      });

      it("prevents further moves after game ends", () => {
        let state = initialState;

        // Uncover treasure
        state = uncoverTile(state, 4);
        expect(state.isGameOver).toBe(true);

        // Try to uncover another tile
        const finalState = uncoverTile(state, 5);
        expect(finalState.tiles[5]).toBe("covered");
        expect(finalState).toEqual(state);
      });
    });

    describe("multi-player support", () => {
      it("cycles through 3 players correctly", () => {
        const state3Players: GameState = {
          tiles: Array(9).fill("covered"),
          treasurePosition: 8,
          currentPlayer: 1,
          winner: null,
          isGameOver: false,
          playerCount: 3,
          playerNames: ["Alice", "Bob", "Charlie"],
          gridSize: 3,
        };

        // Player 1 -> Player 2
        let newState = uncoverTile(state3Players, 0);
        expect(newState.currentPlayer).toBe(2);

        // Player 2 -> Player 3
        newState = uncoverTile(newState, 1);
        expect(newState.currentPlayer).toBe(3);

        // Player 3 -> Player 1 (cycles back)
        newState = uncoverTile(newState, 2);
        expect(newState.currentPlayer).toBe(1);
      });

      it("cycles through 4 players correctly", () => {
        const state4Players: GameState = {
          tiles: Array(16).fill("covered"),
          treasurePosition: 15,
          currentPlayer: 1,
          winner: null,
          isGameOver: false,
          playerCount: 4,
          playerNames: ["P1", "P2", "P3", "P4"],
          gridSize: 4,
        };

        let state = state4Players;

        // Player 1 -> 2 -> 3 -> 4 -> 1
        state = uncoverTile(state, 0);
        expect(state.currentPlayer).toBe(2);

        state = uncoverTile(state, 1);
        expect(state.currentPlayer).toBe(3);

        state = uncoverTile(state, 2);
        expect(state.currentPlayer).toBe(4);

        state = uncoverTile(state, 3);
        expect(state.currentPlayer).toBe(1);
      });

      it("cycles through 6 players correctly", () => {
        const state6Players: GameState = {
          tiles: Array(36).fill("covered"),
          treasurePosition: 35,
          currentPlayer: 1,
          winner: null,
          isGameOver: false,
          playerCount: 6,
          playerNames: ["P1", "P2", "P3", "P4", "P5", "P6"],
          gridSize: 6,
        };

        let state = state6Players;

        // Test cycling through all 6 players
        for (let i = 1; i <= 6; i++) {
          expect(state.currentPlayer).toBe(i as any);
          state = uncoverTile(state, i - 1);
        }

        // Should cycle back to player 1
        expect(state.currentPlayer).toBe(1);
      });

      it("sets correct winner in multi-player game", () => {
        const state3Players: GameState = {
          tiles: Array(9).fill("covered"),
          treasurePosition: 2,
          currentPlayer: 1,
          winner: null,
          isGameOver: false,
          playerCount: 3,
          playerNames: ["Alice", "Bob", "Charlie"],
          gridSize: 3,
        };

        // Player 1 uncovers empty
        let state = uncoverTile(state3Players, 0);
        expect(state.currentPlayer).toBe(2);

        // Player 2 uncovers empty
        state = uncoverTile(state, 1);
        expect(state.currentPlayer).toBe(3);

        // Player 3 finds treasure
        state = uncoverTile(state, 2);
        expect(state.winner).toBe(3);
        expect(state.isGameOver).toBe(true);
      });
    });

    describe("different grid sizes", () => {
      it("handles 4x4 grid correctly", () => {
        const state4x4: GameState = {
          tiles: Array(16).fill("covered"),
          treasurePosition: 10,
          currentPlayer: 1,
          winner: null,
          isGameOver: false,
          playerCount: 2,
          playerNames: ["P1", "P2"],
          gridSize: 4,
        };

        const newState = uncoverTile(state4x4, 10);
        expect(newState.tiles[10]).toBe("uncovered-treasure");
        expect(newState.winner).toBe(1);
        expect(newState.isGameOver).toBe(true);
      });

      it("handles 6x6 grid correctly", () => {
        const state6x6: GameState = {
          tiles: Array(36).fill("covered"),
          treasurePosition: 35,
          currentPlayer: 1,
          winner: null,
          isGameOver: false,
          playerCount: 3,
          playerNames: ["P1", "P2", "P3"],
          gridSize: 6,
        };

        // Uncover non-treasure tile
        let state = uncoverTile(state6x6, 0);
        expect(state.tiles[0]).toBe("uncovered-empty");
        expect(state.currentPlayer).toBe(2);

        // Uncover treasure tile
        state = uncoverTile(state, 35);
        expect(state.tiles[35]).toBe("uncovered-treasure");
        expect(state.winner).toBe(2);
      });
    });
  });
});
