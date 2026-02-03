import {
  initializeGame,
  startTimer,
  stopTimer,
  updateTimer,
  calculateDifference,
  formatTime,
  formatDifference,
  isExactMatch,
  GameState,
  Difficulty,
  getTargetTime,
  formatTargetTime,
  TARGET_TIME,
  FADE_OUT_DURATION,
} from "../gameLogic";

describe("gameLogic - 47 Game", () => {
  describe("constants", () => {
    it("should have TARGET_TIME set to 47.0", () => {
      expect(TARGET_TIME).toBe(47.0);
    });

    it("should have FADE_OUT_DURATION set to 3000ms", () => {
      expect(FADE_OUT_DURATION).toBe(3000);
    });
  });

  describe("getTargetTime", () => {
    it("should return 47.0 for EASY difficulty", () => {
      expect(getTargetTime('EASY')).toBe(47.0);
    });

    it("should return 107.0 for MEDIUM difficulty", () => {
      expect(getTargetTime('MEDIUM')).toBe(107.0);
    });

    it("should return 167.0 for HARD difficulty", () => {
      expect(getTargetTime('HARD')).toBe(167.0);
    });
  });

  describe("formatTargetTime", () => {
    it("should format EASY difficulty as 0:47", () => {
      expect(formatTargetTime('EASY')).toBe('0:47');
    });

    it("should format MEDIUM difficulty as 1:47", () => {
      expect(formatTargetTime('MEDIUM')).toBe('1:47');
    });

    it("should format HARD difficulty as 2:47", () => {
      expect(formatTargetTime('HARD')).toBe('2:47');
    });
  });

  describe("initializeGame", () => {
    it("should return initial game state with null difficulty", () => {
      const state = initializeGame();

      expect(state.startTime).toBeNull();
      expect(state.currentTime).toBe(0);
      expect(state.gameStatus).toBe("initial");
      expect(state.finalTime).toBeNull();
      expect(state.timerVisible).toBe(true);
      expect(state.difficulty).toBeNull();
    });

    it("should return initial game state with specified difficulty", () => {
      const state = initializeGame('MEDIUM');

      expect(state.startTime).toBeNull();
      expect(state.currentTime).toBe(0);
      expect(state.gameStatus).toBe("initial");
      expect(state.finalTime).toBeNull();
      expect(state.timerVisible).toBe(true);
      expect(state.difficulty).toBe('MEDIUM');
    });

    it("should always return a new object", () => {
      const state1 = initializeGame();
      const state2 = initializeGame();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe("startTimer", () => {
    it("should start the timer from initial state", () => {
      const initialState = initializeGame();
      const startedState = startTimer(initialState);

      expect(startedState.gameStatus).toBe("running");
      expect(startedState.startTime).not.toBeNull();
      expect(startedState.currentTime).toBe(0);
      expect(startedState.timerVisible).toBe(true);
    });

    it("should set startTime to current timestamp", () => {
      const beforeTime = Date.now();
      const initialState = initializeGame();
      const startedState = startTimer(initialState);
      const afterTime = Date.now();

      expect(startedState.startTime).toBeGreaterThanOrEqual(beforeTime);
      expect(startedState.startTime).toBeLessThanOrEqual(afterTime);
    });

    it("should not change state if already running", () => {
      const runningState: GameState = {
        startTime: Date.now(),
        currentTime: 10,
        gameStatus: "running",
        finalTime: null,
        timerVisible: true,
      };

      const result = startTimer(runningState);

      expect(result).toEqual(runningState);
    });

    it("should not change state if already stopped", () => {
      const stoppedState: GameState = {
        startTime: Date.now(),
        currentTime: 47.5,
        gameStatus: "stopped",
        finalTime: 47.5,
        timerVisible: false,
      };

      const result = startTimer(stoppedState);

      expect(result).toEqual(stoppedState);
    });

    it("should not mutate original state", () => {
      const initialState = initializeGame();
      const originalState = { ...initialState };

      startTimer(initialState);

      expect(initialState).toEqual(originalState);
    });
  });

  describe("updateTimer", () => {
    it("should update currentTime based on elapsed time", () => {
      const startTime = Date.now() - 5000; // 5 seconds ago
      const runningState: GameState = {
        startTime,
        currentTime: 0,
        gameStatus: "running",
        finalTime: null,
        timerVisible: true,
      };

      const updatedState = updateTimer(runningState);

      expect(updatedState.currentTime).toBeGreaterThanOrEqual(4.9);
      expect(updatedState.currentTime).toBeLessThanOrEqual(5.1);
    });

    it("should return state unchanged if not running", () => {
      const initialState = initializeGame();
      const result = updateTimer(initialState);

      expect(result).toEqual(initialState);
    });

    it("should return state unchanged if startTime is null", () => {
      const state: GameState = {
        startTime: null,
        currentTime: 0,
        gameStatus: "running",
        finalTime: null,
        timerVisible: true,
      };

      const result = updateTimer(state);

      expect(result).toEqual(state);
    });

    it("should not change gameStatus", () => {
      const startTime = Date.now() - 1000;
      const runningState: GameState = {
        startTime,
        currentTime: 0,
        gameStatus: "running",
        finalTime: null,
        timerVisible: true,
      };

      const updatedState = updateTimer(runningState);

      expect(updatedState.gameStatus).toBe("running");
    });

    it("should not mutate original state", () => {
      const startTime = Date.now() - 1000;
      const runningState: GameState = {
        startTime,
        currentTime: 0,
        gameStatus: "running",
        finalTime: null,
        timerVisible: true,
      };
      const originalState = { ...runningState };

      updateTimer(runningState);

      expect(runningState).toEqual(originalState);
    });
  });

  describe("stopTimer", () => {
    it("should stop the timer and set finalTime", () => {
      const runningState: GameState = {
        startTime: Date.now() - 10000,
        currentTime: 10.5,
        gameStatus: "running",
        finalTime: null,
        timerVisible: true,
      };

      const stoppedState = stopTimer(runningState);

      expect(stoppedState.gameStatus).toBe("stopped");
      expect(stoppedState.finalTime).toBe(10.5);
      expect(stoppedState.currentTime).toBe(10.5);
    });

    it("should not change state if not running", () => {
      const initialState = initializeGame();
      const result = stopTimer(initialState);

      expect(result).toEqual(initialState);
    });

    it("should not change state if already stopped", () => {
      const stoppedState: GameState = {
        startTime: Date.now(),
        currentTime: 47.5,
        gameStatus: "stopped",
        finalTime: 47.5,
        timerVisible: false,
      };

      const result = stopTimer(stoppedState);

      expect(result).toEqual(stoppedState);
    });

    it("should not mutate original state", () => {
      const runningState: GameState = {
        startTime: Date.now(),
        currentTime: 10.5,
        gameStatus: "running",
        finalTime: null,
        timerVisible: true,
      };
      const originalState = { ...runningState };

      stopTimer(runningState);

      expect(runningState).toEqual(originalState);
    });
  });

  describe("calculateDifference", () => {
    it("should return positive difference when time is over target for EASY", () => {
      const difference = calculateDifference(50.5, 'EASY');
      expect(difference).toBe(3.5);
    });

    it("should return negative difference when time is under target for EASY", () => {
      const difference = calculateDifference(40.0, 'EASY');
      expect(difference).toBe(-7.0);
    });

    it("should return zero when time matches target exactly for EASY", () => {
      const difference = calculateDifference(47.0, 'EASY');
      expect(difference).toBe(0);
    });

    it("should calculate correctly for MEDIUM difficulty", () => {
      const difference = calculateDifference(110.0, 'MEDIUM');
      expect(difference).toBe(3.0);
    });

    it("should calculate correctly for HARD difficulty", () => {
      const difference = calculateDifference(170.0, 'HARD');
      expect(difference).toBe(3.0);
    });

    it("should handle decimal seconds correctly", () => {
      const difference = calculateDifference(47.25, 'EASY');
      expect(difference).toBeCloseTo(0.25, 2);
    });

    it("should handle very small differences", () => {
      const difference = calculateDifference(47.01, 'EASY');
      expect(difference).toBeCloseTo(0.01, 2);
    });
  });

  describe("formatTime", () => {
    it("should format time with 2 decimal places", () => {
      expect(formatTime(47.0)).toBe("47.00");
      expect(formatTime(47.123)).toBe("47.12");
      expect(formatTime(47.999)).toBe("48.00");
    });

    it("should handle zero", () => {
      expect(formatTime(0)).toBe("0.00");
    });

    it("should handle large numbers", () => {
      expect(formatTime(123.456)).toBe("123.46");
    });

    it("should handle very small numbers", () => {
      expect(formatTime(0.01)).toBe("0.01");
      expect(formatTime(0.001)).toBe("0.00");
    });
  });

  describe("formatDifference", () => {
    it("should format positive difference with + sign", () => {
      expect(formatDifference(1.5)).toBe("+1.50s");
      expect(formatDifference(0.01)).toBe("+0.01s");
    });

    it("should format negative difference with - sign", () => {
      expect(formatDifference(-2.3)).toBe("-2.30s");
      expect(formatDifference(-0.05)).toBe("-0.05s");
    });

    it("should format zero with + sign", () => {
      expect(formatDifference(0)).toBe("+0.00s");
    });

    it("should include 's' suffix", () => {
      expect(formatDifference(5.75)).toContain("s");
    });

    it("should round to 2 decimal places", () => {
      expect(formatDifference(1.234)).toBe("+1.23s");
      expect(formatDifference(-6.789)).toBe("-6.79s");
    });
  });

  describe("isExactMatch", () => {
    it("should return true for exactly 47.0 with EASY difficulty", () => {
      expect(isExactMatch(47.0, 'EASY')).toBe(true);
    });

    it("should return true for values very close to 47.0 with EASY", () => {
      expect(isExactMatch(47.005, 'EASY')).toBe(true);
      expect(isExactMatch(46.995, 'EASY')).toBe(true);
    });

    it("should return false for values outside tolerance with EASY", () => {
      expect(isExactMatch(47.02, 'EASY')).toBe(false);
      expect(isExactMatch(46.98, 'EASY')).toBe(false);
    });

    it("should return true for exact match with MEDIUM difficulty", () => {
      expect(isExactMatch(107.0, 'MEDIUM')).toBe(true);
      expect(isExactMatch(107.005, 'MEDIUM')).toBe(true);
    });

    it("should return true for exact match with HARD difficulty", () => {
      expect(isExactMatch(167.0, 'HARD')).toBe(true);
      expect(isExactMatch(167.005, 'HARD')).toBe(true);
    });

    it("should return false for significantly different values", () => {
      expect(isExactMatch(50.0, 'EASY')).toBe(false);
      expect(isExactMatch(40.0, 'EASY')).toBe(false);
    });

    it("should handle edge cases near boundaries", () => {
      expect(isExactMatch(47.009, 'EASY')).toBe(true); // Just within 0.01
      expect(isExactMatch(47.011, 'EASY')).toBe(false); // Just outside 0.01
      expect(isExactMatch(46.991, 'EASY')).toBe(true); // Just within 0.01
      expect(isExactMatch(46.989, 'EASY')).toBe(false); // Just outside 0.01
    });
  });

  describe("integration", () => {
    it("should support full game flow from start to stop with difficulty", () => {
      let state = initializeGame('EASY');
      expect(state.gameStatus).toBe("initial");
      expect(state.difficulty).toBe('EASY');

      // Start the timer
      state = startTimer(state);
      expect(state.gameStatus).toBe("running");
      expect(state.startTime).not.toBeNull();

      // Simulate time passing
      const startTime = state.startTime! - 47000; // 47 seconds ago
      state = { ...state, startTime };
      state = updateTimer(state);

      expect(state.currentTime).toBeGreaterThan(46);
      expect(state.currentTime).toBeLessThan(48);

      // Stop the timer
      state = stopTimer(state);
      expect(state.gameStatus).toBe("stopped");
      expect(state.finalTime).not.toBeNull();
      expect(state.finalTime).toBeGreaterThan(46);
    });

    it("should calculate and format results correctly for EASY", () => {
      const finalTime = 48.5;
      const difference = calculateDifference(finalTime, 'EASY');

      expect(difference).toBe(1.5);
      expect(formatTime(finalTime)).toBe("48.50");
      expect(formatDifference(difference)).toBe("+1.50s");
      expect(isExactMatch(finalTime, 'EASY')).toBe(false);
    });

    it("should handle winning scenario for EASY", () => {
      const finalTime = 47.0;
      const difference = calculateDifference(finalTime, 'EASY');

      expect(difference).toBe(0);
      expect(isExactMatch(finalTime, 'EASY')).toBe(true);
      expect(formatDifference(difference)).toBe("+0.00s");
    });

    it("should handle winning scenario for MEDIUM", () => {
      const finalTime = 107.0;
      const difference = calculateDifference(finalTime, 'MEDIUM');

      expect(difference).toBe(0);
      expect(isExactMatch(finalTime, 'MEDIUM')).toBe(true);
      expect(formatDifference(difference)).toBe("+0.00s");
    });
  });

  describe("state immutability", () => {
    it("should not mutate state in any function", () => {
      const originalState = initializeGame();
      const stateCopy = { ...originalState };

      startTimer(originalState);
      expect(originalState).toEqual(stateCopy);

      const runningState: GameState = {
        startTime: Date.now(),
        currentTime: 10,
        gameStatus: "running",
        finalTime: null,
        timerVisible: true,
      };
      const runningStateCopy = { ...runningState };

      updateTimer(runningState);
      expect(runningState).toEqual(runningStateCopy);

      stopTimer(runningState);
      expect(runningState).toEqual(runningStateCopy);
    });
  });
});
