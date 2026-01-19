import { describe, it, expect } from '@jest/globals';
import {
  generateSecretNumber,
  initializeGame,
  processGuess,
  DEFAULT_CONFIG,
  GameConfig,
} from '../number-guess/gameLogic';

describe('Number Guess Game Logic', () => {
  describe('generateSecretNumber', () => {
    it('generates a number within the specified range', () => {
      for (let i = 0; i < 100; i++) {
        const number = generateSecretNumber(1, 100);
        expect(number).toBeGreaterThanOrEqual(1);
        expect(number).toBeLessThanOrEqual(100);
      }
    });

    it('can generate number at minimum boundary', () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateSecretNumber(1, 10));
      }
      expect(numbers.has(1)).toBe(true);
    });

    it('can generate number at maximum boundary', () => {
      const numbers = new Set();
      for (let i = 0; i < 100; i++) {
        numbers.add(generateSecretNumber(1, 10));
      }
      expect(numbers.has(10)).toBe(true);
    });
  });

  describe('initializeGame', () => {
    it('creates initial game state with default config', () => {
      const state = initializeGame();
      
      expect(state.secretNumber).toBeGreaterThanOrEqual(DEFAULT_CONFIG.minNumber);
      expect(state.secretNumber).toBeLessThanOrEqual(DEFAULT_CONFIG.maxNumber);
      expect(state.remainingAttempts).toBe(DEFAULT_CONFIG.maxAttempts);
      expect(state.gameStatus).toBe('playing');
      expect(state.lastGuess).toBeNull();
      expect(state.lastResult).toBeNull();
    });

    it('creates initial game state with custom config', () => {
      const customConfig: GameConfig = {
        minNumber: 1,
        maxNumber: 50,
        maxAttempts: 3,
      };
      
      const state = initializeGame(customConfig);
      
      expect(state.secretNumber).toBeGreaterThanOrEqual(1);
      expect(state.secretNumber).toBeLessThanOrEqual(50);
      expect(state.remainingAttempts).toBe(3);
    });
  });

  describe('processGuess', () => {
    it('returns "higher" when guess is too low', () => {
      const state = initializeGame();
      // Force a known secret number for testing
      const testState = { ...state, secretNumber: 50 };
      
      const newState = processGuess(testState, 30);
      
      expect(newState.lastGuess).toBe(30);
      expect(newState.lastResult).toBe('higher');
      expect(newState.gameStatus).toBe('playing');
      expect(newState.remainingAttempts).toBe(DEFAULT_CONFIG.maxAttempts - 1);
    });

    it('returns "lower" when guess is too high', () => {
      const state = initializeGame();
      const testState = { ...state, secretNumber: 50 };
      
      const newState = processGuess(testState, 70);
      
      expect(newState.lastGuess).toBe(70);
      expect(newState.lastResult).toBe('lower');
      expect(newState.gameStatus).toBe('playing');
      expect(newState.remainingAttempts).toBe(DEFAULT_CONFIG.maxAttempts - 1);
    });

    it('returns "correct" and sets status to "won" when guess is correct', () => {
      const state = initializeGame();
      const testState = { ...state, secretNumber: 50 };
      
      const newState = processGuess(testState, 50);
      
      expect(newState.lastGuess).toBe(50);
      expect(newState.lastResult).toBe('correct');
      expect(newState.gameStatus).toBe('won');
    });

    it('decrements remaining attempts', () => {
      const state = initializeGame();
      const testState = { ...state, secretNumber: 50, remainingAttempts: 3 };
      
      const newState = processGuess(testState, 30);
      
      expect(newState.remainingAttempts).toBe(2);
    });

    it('sets status to "lost" when out of attempts', () => {
      const state = initializeGame();
      const testState = { ...state, secretNumber: 50, remainingAttempts: 1 };
      
      const newState = processGuess(testState, 30);
      
      expect(newState.gameStatus).toBe('lost');
      expect(newState.remainingAttempts).toBe(0);
    });

    it('does not accept guesses outside valid range', () => {
      const state = initializeGame();
      const testState = { ...state, secretNumber: 50, remainingAttempts: 5 };
      
      const newState = processGuess(testState, 101);
      
      expect(newState).toEqual(testState);
      expect(newState.remainingAttempts).toBe(5);
    });

    it('does not process guesses when game is won', () => {
      const state = initializeGame();
      const testState = { ...state, secretNumber: 50, gameStatus: 'won' as const };
      
      const newState = processGuess(testState, 30);
      
      expect(newState).toEqual(testState);
    });

    it('does not process guesses when game is lost', () => {
      const state = initializeGame();
      const testState = { ...state, secretNumber: 50, gameStatus: 'lost' as const, remainingAttempts: 0 };
      
      const newState = processGuess(testState, 30);
      
      expect(newState).toEqual(testState);
    });
  });
});
