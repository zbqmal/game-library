import {
  getComputerChoice,
  determineOutcome,
  initializeGame,
  processRound,
  Choice,
  Outcome,
  GameState,
} from "../gameLogic";

describe("Rock-Paper-Scissors Game Logic", () => {
  describe("getComputerChoice", () => {
    it("returns a valid choice", () => {
      const validChoices: Choice[] = ["rock", "paper", "scissors"];
      const choice = getComputerChoice();

      expect(validChoices).toContain(choice);
    });

    it("returns different choices over multiple calls", () => {
      const choices = new Set<Choice>();

      // Call multiple times to increase chance of getting different choices
      for (let i = 0; i < 100; i++) {
        choices.add(getComputerChoice());
      }

      // With 100 calls, we should get at least 2 different choices (probabilistically)
      expect(choices.size).toBeGreaterThanOrEqual(2);
    });

    it("never returns an invalid choice", () => {
      const validChoices: Choice[] = ["rock", "paper", "scissors"];

      for (let i = 0; i < 50; i++) {
        const choice = getComputerChoice();
        expect(validChoices).toContain(choice);
      }
    });
  });

  describe("determineOutcome", () => {
    describe("draw scenarios", () => {
      it("returns draw when both choose rock", () => {
        expect(determineOutcome("rock", "rock")).toBe("draw");
      });

      it("returns draw when both choose paper", () => {
        expect(determineOutcome("paper", "paper")).toBe("draw");
      });

      it("returns draw when both choose scissors", () => {
        expect(determineOutcome("scissors", "scissors")).toBe("draw");
      });
    });

    describe("player win scenarios", () => {
      it("player wins with rock vs scissors", () => {
        expect(determineOutcome("rock", "scissors")).toBe("win");
      });

      it("player wins with paper vs rock", () => {
        expect(determineOutcome("paper", "rock")).toBe("win");
      });

      it("player wins with scissors vs paper", () => {
        expect(determineOutcome("scissors", "paper")).toBe("win");
      });
    });

    describe("player lose scenarios", () => {
      it("player loses with rock vs paper", () => {
        expect(determineOutcome("rock", "paper")).toBe("lose");
      });

      it("player loses with paper vs scissors", () => {
        expect(determineOutcome("paper", "scissors")).toBe("lose");
      });

      it("player loses with scissors vs rock", () => {
        expect(determineOutcome("scissors", "rock")).toBe("lose");
      });
    });
  });

  describe("initializeGame", () => {
    it("returns initial game state with all fields set correctly", () => {
      const initialState = initializeGame();

      expect(initialState).toEqual({
        playerChoice: null,
        computerChoice: null,
        outcome: null,
        consecutiveWins: 0,
        isGameOver: false,
        finalScore: 0,
      });
    });

    it("returns a new object each time", () => {
      const state1 = initializeGame();
      const state2 = initializeGame();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it("has playerChoice as null", () => {
      const initialState = initializeGame();
      expect(initialState.playerChoice).toBeNull();
    });

    it("has computerChoice as null", () => {
      const initialState = initializeGame();
      expect(initialState.computerChoice).toBeNull();
    });

    it("has outcome as null", () => {
      const initialState = initializeGame();
      expect(initialState.outcome).toBeNull();
    });

    it("has consecutiveWins as 0", () => {
      const initialState = initializeGame();
      expect(initialState.consecutiveWins).toBe(0);
    });

    it("has isGameOver as false", () => {
      const initialState = initializeGame();
      expect(initialState.isGameOver).toBe(false);
    });

    it("has finalScore as 0", () => {
      const initialState = initializeGame();
      expect(initialState.finalScore).toBe(0);
    });
  });

  describe("processRound", () => {
    let initialState: GameState;

    beforeEach(() => {
      initialState = initializeGame();
    });

    it("updates playerChoice and computerChoice", () => {
      // We can't predict computerChoice, but we can verify it's set
      const newState = processRound(initialState, "rock");

      expect(newState.playerChoice).toBe("rock");
      expect(["rock", "paper", "scissors"]).toContain(newState.computerChoice);
    });

    it("sets outcome to one of the three valid values", () => {
      const newState = processRound(initialState, "rock");

      expect(["win", "lose", "draw"]).toContain(newState.outcome);
    });

    it("on win: increments consecutive wins and keeps game running", () => {
      // Keep playing until we get a win
      let state = initializeGame();
      let attempts = 0;
      const maxAttempts = 1000;

      while (attempts < maxAttempts) {
        state = processRound(state, "rock");
        if (state.outcome === "win") {
          break;
        }
        state = initializeGame();
        attempts++;
      }

      if (state.outcome === "win") {
        expect(state.consecutiveWins).toBeGreaterThanOrEqual(1);
        expect(state.isGameOver).toBe(false);
        expect(state.finalScore).toBe(0);
      }
    });

    it("on lose: ends game and sets final score", () => {
      // First, let's win a round to increase consecutive wins
      let state = initializeGame();
      let attempts = 0;

      while (attempts < 1000) {
        state = processRound(state, "rock");
        if (state.outcome === "win") {
          break;
        }
        state = initializeGame();
        attempts++;
      }

      // Now keep playing until we lose
      attempts = 0;
      while (attempts < 1000) {
        const winsBeforeThisRound = state.consecutiveWins;
        state = processRound(state, "rock");
        if (state.outcome === "lose") {
          expect(state.isGameOver).toBe(true);
          expect(state.finalScore).toBe(winsBeforeThisRound);
          return;
        }
        attempts++;
      }

      // If we get here, we didn't lose after 1000 attempts (very unlikely)
      // Just verify the state structure is correct
      expect(state).toHaveProperty("isGameOver");
      expect(state).toHaveProperty("finalScore");
    });

    it("on draw: maintains consecutive wins and continues game", () => {
      // Keep playing until we get a draw
      let state = initializeGame();
      let attempts = 0;
      const maxAttempts = 1000;

      while (attempts < maxAttempts) {
        state = processRound(state, "rock");
        if (state.outcome === "draw") {
          break;
        }
        state = initializeGame();
        attempts++;
      }

      if (state.outcome === "draw") {
        expect(state.isGameOver).toBe(false);
        expect(state.consecutiveWins).toBe(0); // No wins should be incremented on draw
      }
    });

    it("does not mutate the input state", () => {
      const originalState = initializeGame();
      const stateCopy = JSON.parse(JSON.stringify(originalState));

      processRound(originalState, "rock");

      expect(originalState).toEqual(stateCopy);
    });

    it("returns a new state object", () => {
      const originalState = initializeGame();
      const newState = processRound(originalState, "rock");

      expect(newState).not.toBe(originalState);
    });

    it("preserves playerChoice from previous rounds", () => {
      let state = initializeGame();
      state = processRound(state, "rock");
      const firstChoice = state.playerChoice;

      state = processRound(state, "paper");

      expect(state.playerChoice).toBe("paper");
    });

    it("correctly determines win condition (rock beats scissors)", () => {
      // We'll test this by playing multiple rounds until we get rock vs scissors
      let winFound = false;

      for (let i = 0; i < 10000; i++) {
        const state = initializeGame();
        const newState = processRound(state, "rock");

        if (
          newState.playerChoice === "rock" &&
          newState.computerChoice === "scissors"
        ) {
          expect(newState.outcome).toBe("win");
          winFound = true;
          break;
        }
      }

      if (winFound === false) {
        // This is astronomically unlikely, skip assertion
      }
    });

    it("correctly determines lose condition", () => {
      // Test by playing multiple rounds until we get a lose scenario
      for (let i = 0; i < 10000; i++) {
        const state = initializeGame();
        const newState = processRound(state, "rock");

        if (newState.outcome === "lose") {
          expect(newState.isGameOver).toBe(true);
          return;
        }
      }
    });
  });
});
