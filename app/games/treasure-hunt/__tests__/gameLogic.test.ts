import {
  initializeGame,
  uncoverTile,
  GameState,
  TileState,
} from "../gameLogic";

describe("Treasure Hunt Game Logic", () => {
  describe("initializeGame", () => {
    it("returns initial game state with correct structure", () => {
      const state = initializeGame();

      expect(state).toHaveProperty("tiles");
      expect(state).toHaveProperty("treasurePosition");
      expect(state).toHaveProperty("currentPlayer");
      expect(state).toHaveProperty("winner");
      expect(state).toHaveProperty("isGameOver");
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
  });
});
