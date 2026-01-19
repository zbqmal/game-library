import {
  getComputerChoice,
  determineOutcome,
  initializeGame,
  processRound,
  Choice,
} from '../rps/gameLogic';

describe('Rock-Paper-Scissors Game Logic', () => {
  describe('getComputerChoice', () => {
    it('returns a valid choice', () => {
      const validChoices: Choice[] = ['rock', 'paper', 'scissors'];
      
      for (let i = 0; i < 100; i++) {
        const choice = getComputerChoice();
        expect(validChoices).toContain(choice);
      }
    });

    it('generates all possible choices over multiple calls', () => {
      const choices = new Set<Choice>();
      
      for (let i = 0; i < 100; i++) {
        choices.add(getComputerChoice());
      }
      
      expect(choices.size).toBe(3);
      expect(choices.has('rock')).toBe(true);
      expect(choices.has('paper')).toBe(true);
      expect(choices.has('scissors')).toBe(true);
    });
  });

  describe('determineOutcome', () => {
    it('returns "draw" when both choices are the same', () => {
      expect(determineOutcome('rock', 'rock')).toBe('draw');
      expect(determineOutcome('paper', 'paper')).toBe('draw');
      expect(determineOutcome('scissors', 'scissors')).toBe('draw');
    });

    it('returns "win" when player wins', () => {
      expect(determineOutcome('rock', 'scissors')).toBe('win');
      expect(determineOutcome('paper', 'rock')).toBe('win');
      expect(determineOutcome('scissors', 'paper')).toBe('win');
    });

    it('returns "lose" when player loses', () => {
      expect(determineOutcome('rock', 'paper')).toBe('lose');
      expect(determineOutcome('paper', 'scissors')).toBe('lose');
      expect(determineOutcome('scissors', 'rock')).toBe('lose');
    });
  });

  describe('initializeGame', () => {
    it('creates initial game state', () => {
      const state = initializeGame();
      
      expect(state.playerChoice).toBeNull();
      expect(state.computerChoice).toBeNull();
      expect(state.outcome).toBeNull();
      expect(state.consecutiveWins).toBe(0);
      expect(state.isGameOver).toBe(false);
      expect(state.finalScore).toBe(0);
    });
  });

  describe('processRound', () => {
    it('increments consecutive wins on player win', () => {
      const state = initializeGame();
      // We can't control random, so we'll test the logic with known outcomes
      const stateWithWins = { ...state, consecutiveWins: 3 };
      
      // Mock the outcome by testing the logic manually
      // If player chooses rock and computer chooses scissors, player wins
      const playerChoice: Choice = 'rock';
      
      // Since getComputerChoice is random, we'll test multiple times
      let hasWin = false;
      for (let i = 0; i < 100; i++) {
        const newState = processRound(stateWithWins, playerChoice);
        if (newState.outcome === 'win') {
          expect(newState.consecutiveWins).toBe(4);
          expect(newState.isGameOver).toBe(false);
          hasWin = true;
          break;
        }
      }
      // At least one win should occur in 100 attempts
      expect(hasWin).toBe(true);
    });

    it('sets game over and final score on player loss', () => {
      const state = { ...initializeGame(), consecutiveWins: 5 };
      
      // Keep trying until we get a loss
      let hasLoss = false;
      for (let i = 0; i < 100; i++) {
        const newState = processRound(state, 'rock');
        if (newState.outcome === 'lose') {
          expect(newState.isGameOver).toBe(true);
          expect(newState.finalScore).toBe(5);
          hasLoss = true;
          break;
        }
      }
      expect(hasLoss).toBe(true);
    });

    it('maintains consecutive wins on draw', () => {
      const state = { ...initializeGame(), consecutiveWins: 3 };
      
      // Keep trying until we get a draw
      let hasDraw = false;
      for (let i = 0; i < 100; i++) {
        const newState = processRound(state, 'rock');
        if (newState.outcome === 'draw') {
          expect(newState.consecutiveWins).toBe(3);
          expect(newState.isGameOver).toBe(false);
          hasDraw = true;
          break;
        }
      }
      expect(hasDraw).toBe(true);
    });

    it('sets player and computer choices', () => {
      const state = initializeGame();
      const playerChoice: Choice = 'paper';
      
      const newState = processRound(state, playerChoice);
      
      expect(newState.playerChoice).toBe('paper');
      expect(newState.computerChoice).not.toBeNull();
      expect(['rock', 'paper', 'scissors']).toContain(newState.computerChoice);
    });

    it('correctly determines outcome based on choices', () => {
      const state = initializeGame();
      
      // Test enough rounds to cover all outcomes
      const outcomes = new Set();
      for (let i = 0; i < 100; i++) {
        const newState = processRound(state, 'rock');
        outcomes.add(newState.outcome);
      }
      
      // All three outcomes should appear over 100 rounds
      expect(outcomes.size).toBe(3);
    });
  });
});
