import {
  generateSecretNumber,
  initializeGame,
  processGuess,
  GameState,
  GameConfig,
  DEFAULT_CONFIG,
  SAFE_LIMITS,
} from "../gameLogic";

describe("gameLogic - Up and Down Game", () => {
  describe("generateSecretNumber", () => {
    it("should generate a number within the specified range", () => {
      const min = 1;
      const max = 100;
      const secretNumber = generateSecretNumber(min, max);

      expect(secretNumber).toBeGreaterThanOrEqual(min);
      expect(secretNumber).toBeLessThanOrEqual(max);
    });

    it("should generate different numbers on multiple calls", () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateSecretNumber(1, 100));
      }
      // With 100 random numbers from 1-100, we should get multiple different values
      expect(numbers.size).toBeGreaterThan(1);
    });

    it("should work with single value range", () => {
      const secretNumber = generateSecretNumber(42, 42);
      expect(secretNumber).toBe(42);
    });

    it("should work with large ranges", () => {
      const secretNumber = generateSecretNumber(1, 10000);
      expect(secretNumber).toBeGreaterThanOrEqual(1);
      expect(secretNumber).toBeLessThanOrEqual(10000);
    });

    it("should work with negative ranges", () => {
      const secretNumber = generateSecretNumber(-100, 100);
      expect(secretNumber).toBeGreaterThanOrEqual(-100);
      expect(secretNumber).toBeLessThanOrEqual(100);
    });
  });

  describe("initializeGame", () => {
    it("should initialize with default config", () => {
      const gameState = initializeGame();

      expect(gameState.remainingAttempts).toBe(DEFAULT_CONFIG.maxAttempts);
      expect(gameState.gameStatus).toBe("playing");
      expect(gameState.lastGuess).toBeNull();
      expect(gameState.lastResult).toBeNull();
    });

    it("should initialize with custom config", () => {
      const customConfig: GameConfig = {
        minNumber: 1,
        maxNumber: 50,
        maxAttempts: 10,
      };

      const gameState = initializeGame(customConfig);

      expect(gameState.secretNumber).toBeGreaterThanOrEqual(1);
      expect(gameState.secretNumber).toBeLessThanOrEqual(50);
      expect(gameState.remainingAttempts).toBe(10);
      expect(gameState.gameStatus).toBe("playing");
    });

    it("should generate a secret number within the range", () => {
      const customConfig: GameConfig = {
        minNumber: 10,
        maxNumber: 20,
        maxAttempts: 5,
      };

      const gameState = initializeGame(customConfig);

      expect(gameState.secretNumber).toBeGreaterThanOrEqual(10);
      expect(gameState.secretNumber).toBeLessThanOrEqual(20);
    });

    it("should initialize with all required properties", () => {
      const gameState = initializeGame();

      expect(gameState).toHaveProperty("secretNumber");
      expect(gameState).toHaveProperty("remainingAttempts");
      expect(gameState).toHaveProperty("gameStatus");
      expect(gameState).toHaveProperty("lastGuess");
      expect(gameState).toHaveProperty("lastResult");
    });
  });

  describe("processGuess", () => {
    let initialState: GameState;
    const testConfig: GameConfig = {
      minNumber: 1,
      maxNumber: 100,
      maxAttempts: 5,
    };

    beforeEach(() => {
      initialState = {
        secretNumber: 50,
        remainingAttempts: 5,
        gameStatus: "playing",
        lastGuess: null,
        lastResult: null,
      };
    });

    describe("correct guess", () => {
      it("should return won status when guess matches secret number", () => {
        const result = processGuess(initialState, 50, testConfig);

        expect(result.gameStatus).toBe("won");
        expect(result.lastGuess).toBe(50);
        expect(result.lastResult).toBe("correct");
      });

      it("should decrement remaining attempts on correct guess", () => {
        const result = processGuess(initialState, 50, testConfig);

        expect(result.remainingAttempts).toBe(4);
      });
    });

    describe("incorrect guess - too high", () => {
      it("should return lower result when guess is too high", () => {
        const result = processGuess(initialState, 75, testConfig);

        expect(result.lastResult).toBe("lower");
        expect(result.lastGuess).toBe(75);
      });

      it("should keep game status as playing when guess is too high", () => {
        const result = processGuess(initialState, 75, testConfig);

        expect(result.gameStatus).toBe("playing");
      });

      it("should decrement remaining attempts", () => {
        const result = processGuess(initialState, 75, testConfig);

        expect(result.remainingAttempts).toBe(4);
      });
    });

    describe("incorrect guess - too low", () => {
      it("should return higher result when guess is too low", () => {
        const result = processGuess(initialState, 25, testConfig);

        expect(result.lastResult).toBe("higher");
        expect(result.lastGuess).toBe(25);
      });

      it("should keep game status as playing when guess is too low", () => {
        const result = processGuess(initialState, 25, testConfig);

        expect(result.gameStatus).toBe("playing");
      });

      it("should decrement remaining attempts", () => {
        const result = processGuess(initialState, 25, testConfig);

        expect(result.remainingAttempts).toBe(4);
      });
    });

    describe("invalid guess", () => {
      it("should not change state for guess below minimum", () => {
        const result = processGuess(initialState, 0, testConfig);

        expect(result).toEqual(initialState);
      });

      it("should not change state for guess above maximum", () => {
        const result = processGuess(initialState, 101, testConfig);

        expect(result).toEqual(initialState);
      });

      it("should not decrement attempts for invalid guesses", () => {
        const result = processGuess(initialState, 0, testConfig);

        expect(result.remainingAttempts).toBe(5);
      });
    });

    describe("game over states", () => {
      it("should not process guess when game is won", () => {
        const wonState: GameState = {
          ...initialState,
          gameStatus: "won",
        };

        const result = processGuess(wonState, 25, testConfig);

        expect(result).toEqual(wonState);
      });

      it("should not process guess when game is lost", () => {
        const lostState: GameState = {
          ...initialState,
          gameStatus: "lost",
        };

        const result = processGuess(lostState, 25, testConfig);

        expect(result).toEqual(lostState);
      });
    });

    describe("out of attempts", () => {
      it("should set status to lost when attempts reach zero", () => {
        const stateWithOneAttempt: GameState = {
          ...initialState,
          remainingAttempts: 1,
        };

        const result = processGuess(stateWithOneAttempt, 25, testConfig);

        expect(result.gameStatus).toBe("lost");
        expect(result.remainingAttempts).toBe(0);
      });

      it("should set status to lost only on the last attempt", () => {
        const stateWithTwoAttempts: GameState = {
          ...initialState,
          remainingAttempts: 2,
        };

        const result = processGuess(stateWithTwoAttempts, 25, testConfig);

        expect(result.gameStatus).toBe("playing");
        expect(result.remainingAttempts).toBe(1);
      });
    });

    describe("with default config", () => {
      it("should work with default config when not provided", () => {
        const result = processGuess(initialState, 60);

        expect(result.lastGuess).toBe(60);
        expect(result.lastResult).toBe("lower");
      });
    });

    describe("immutability", () => {
      it("should not mutate the original state", () => {
        const originalState = { ...initialState };
        processGuess(initialState, 25, testConfig);

        expect(initialState).toEqual(originalState);
      });

      it("should return a new object", () => {
        const result = processGuess(initialState, 25, testConfig);

        expect(result).not.toBe(initialState);
      });
    });

    describe("multiple guesses in sequence", () => {
      it("should track multiple guesses correctly", () => {
        let state = initialState;

        // First guess
        state = processGuess(state, 25, testConfig);
        expect(state.lastGuess).toBe(25);
        expect(state.lastResult).toBe("higher");
        expect(state.remainingAttempts).toBe(4);

        // Second guess
        state = processGuess(state, 75, testConfig);
        expect(state.lastGuess).toBe(75);
        expect(state.lastResult).toBe("lower");
        expect(state.remainingAttempts).toBe(3);

        // Third guess - correct
        state = processGuess(state, 50, testConfig);
        expect(state.lastGuess).toBe(50);
        expect(state.lastResult).toBe("correct");
        expect(state.gameStatus).toBe("won");
        expect(state.remainingAttempts).toBe(2);
      });

      it("should track attempts to loss", () => {
        let state = {
          ...initialState,
          remainingAttempts: 2,
        };

        // First wrong guess
        state = processGuess(state, 25, testConfig);
        expect(state.gameStatus).toBe("playing");
        expect(state.remainingAttempts).toBe(1);

        // Second wrong guess - loses
        state = processGuess(state, 75, testConfig);
        expect(state.gameStatus).toBe("lost");
        expect(state.remainingAttempts).toBe(0);
      });
    });
  });

  describe("integration", () => {
    it("should support a full game flow from initialization to win", () => {
      const customConfig: GameConfig = {
        minNumber: 1,
        maxNumber: 10,
        maxAttempts: 5,
      };

      let state = initializeGame(customConfig);
      const secretNumber = state.secretNumber;

      // Make the correct guess
      state = processGuess(state, secretNumber, customConfig);

      expect(state.gameStatus).toBe("won");
      expect(state.lastResult).toBe("correct");
    });

    it("should support a full game flow from initialization to loss", () => {
      const customConfig: GameConfig = {
        minNumber: 1,
        maxNumber: 100,
        maxAttempts: 2,
      };

      let state = initializeGame(customConfig);

      // Make wrong guesses
      state = processGuess(state, 1, customConfig);
      expect(state.gameStatus).toBe("playing");

      state = processGuess(state, 100, customConfig);
      expect(state.gameStatus).toBe("lost");
    });
  });

  describe("constants and configuration", () => {
    it("should have DEFAULT_CONFIG with expected values", () => {
      expect(DEFAULT_CONFIG.minNumber).toBe(1);
      expect(DEFAULT_CONFIG.maxNumber).toBe(100);
      expect(DEFAULT_CONFIG.maxAttempts).toBe(5);
    });

    it("should have SAFE_LIMITS with expected values", () => {
      expect(SAFE_LIMITS.maxNumber).toBeGreaterThan(DEFAULT_CONFIG.maxNumber);
      expect(SAFE_LIMITS.maxAttempts).toBeGreaterThan(
        DEFAULT_CONFIG.maxAttempts,
      );
    });
  });
});
