import {
  initializeGame,
  setAction,
  processQuestion,
  processGuess,
  GameState,
  AIService,
} from '../gameLogic';

// Mock AI Service for testing
class MockAIService implements AIService {
  constructor(
    private answer: string = 'elephant',
    private questionValidator: (q: string) => boolean = () => true,
    private questionResponder: (q: string, a: string) => 'Yes' | 'No' = () => 'Yes'
  ) {}

  selectAnswer(): string {
    return this.answer;
  }

  isYesNoQuestion(question: string): boolean {
    return this.questionValidator(question);
  }

  answerQuestion(question: string, answer: string): 'Yes' | 'No' {
    return this.questionResponder(question, answer);
  }

  isCorrectGuess(guess: string, answer: string): boolean {
    return guess.toLowerCase().trim() === answer.toLowerCase().trim();
  }
}

describe('Twenty Questions Game Logic', () => {
  describe('initializeGame', () => {
    it('should initialize game with correct default state', () => {
      const mockAI = new MockAIService('testAnswer');
      const state = initializeGame(mockAI);

      expect(state.secretAnswer).toBe('testAnswer');
      expect(state.remainingAttempts).toBe(20);
      expect(state.gameStatus).toBe('playing');
      expect(state.actionHistory).toEqual([]);
      expect(state.currentAction).toBeNull();
    });

    it('should select different answers on multiple initializations', () => {
      const state1 = initializeGame();
      const state2 = initializeGame();
      const state3 = initializeGame();

      // At least one should be different
      const allSame = state1.secretAnswer === state2.secretAnswer && 
                      state2.secretAnswer === state3.secretAnswer;
      expect(allSame).toBe(false);
    });
  });

  describe('setAction', () => {
    it('should set current action to question', () => {
      const mockAI = new MockAIService();
      const state = initializeGame(mockAI);
      const newState = setAction(state, 'question');

      expect(newState.currentAction).toBe('question');
    });

    it('should set current action to guess', () => {
      const mockAI = new MockAIService();
      const state = initializeGame(mockAI);
      const newState = setAction(state, 'guess');

      expect(newState.currentAction).toBe('guess');
    });

    it('should not change action when game is won', () => {
      const mockAI = new MockAIService();
      const state: GameState = {
        ...initializeGame(mockAI),
        gameStatus: 'won',
      };
      const newState = setAction(state, 'question');

      expect(newState.currentAction).toBeNull();
    });

    it('should not change action when game is lost', () => {
      const mockAI = new MockAIService();
      const state: GameState = {
        ...initializeGame(mockAI),
        gameStatus: 'lost',
      };
      const newState = setAction(state, 'guess');

      expect(newState.currentAction).toBeNull();
    });

    it('should allow setting action in final guess phase', () => {
      const mockAI = new MockAIService();
      const state: GameState = {
        ...initializeGame(mockAI),
        gameStatus: 'finalGuess',
      };
      const newState = setAction(state, 'guess');

      expect(newState.currentAction).toBe('guess');
    });
  });

  describe('processQuestion', () => {
    it('should process valid yes/no question correctly', () => {
      const mockAI = new MockAIService('elephant', () => true, () => 'Yes');
      const state = initializeGame(mockAI);
      const newState = processQuestion(state, 'Is it alive?', mockAI);

      expect(newState.remainingAttempts).toBe(19);
      expect(newState.actionHistory).toHaveLength(1);
      expect(newState.actionHistory[0]).toEqual({
        type: 'question',
        input: 'Is it alive?',
        response: 'Yes',
        attemptNumber: 1,
      });
      expect(newState.currentAction).toBeNull();
    });

    it('should mark invalid questions as invalid', () => {
      const mockAI = new MockAIService('elephant', () => false);
      const state = initializeGame(mockAI);
      const newState = processQuestion(state, 'What is it?', mockAI);

      expect(newState.remainingAttempts).toBe(19);
      expect(newState.actionHistory).toHaveLength(1);
      expect(newState.actionHistory[0].response).toBe('Invalid question');
    });

    it('should still decrement attempts for invalid questions', () => {
      const mockAI = new MockAIService('elephant', () => false);
      const state = initializeGame(mockAI);
      const newState = processQuestion(state, 'What color is it?', mockAI);

      expect(newState.remainingAttempts).toBe(19);
    });

    it('should not process empty questions', () => {
      const mockAI = new MockAIService();
      const state = initializeGame(mockAI);
      const newState = processQuestion(state, '   ', mockAI);

      expect(newState.remainingAttempts).toBe(20);
      expect(newState.actionHistory).toHaveLength(0);
    });

    it('should transition to finalGuess when reaching 0 attempts', () => {
      const mockAI = new MockAIService('elephant', () => true, () => 'No');
      const state = { ...initializeGame(mockAI), remainingAttempts: 1 };

      const newState = processQuestion(state, 'Is it small?', mockAI);

      expect(newState.remainingAttempts).toBe(0);
      expect(newState.gameStatus).toBe('finalGuess');
    });

    it('should track multiple questions in history', () => {
      const mockAI = new MockAIService('elephant', () => true);
      let state = initializeGame(mockAI);

      state = processQuestion(state, 'Is it alive?', mockAI);
      state = processQuestion(state, 'Is it big?', mockAI);
      state = processQuestion(state, 'Does it have four legs?', mockAI);

      expect(state.actionHistory).toHaveLength(3);
      expect(state.actionHistory[0].attemptNumber).toBe(1);
      expect(state.actionHistory[1].attemptNumber).toBe(2);
      expect(state.actionHistory[2].attemptNumber).toBe(3);
      expect(state.remainingAttempts).toBe(17);
    });

    it('should not process questions when game is not playing', () => {
      const mockAI = new MockAIService();
      const state: GameState = {
        ...initializeGame(mockAI),
        gameStatus: 'won',
      };
      const newState = processQuestion(state, 'Is it alive?', mockAI);

      expect(newState.actionHistory).toHaveLength(0);
    });
  });

  describe('processGuess', () => {
    it('should win game with correct guess', () => {
      const mockAI = new MockAIService('elephant');
      const state = initializeGame(mockAI);
      const newState = processGuess(state, 'elephant', mockAI);

      expect(newState.gameStatus).toBe('won');
      expect(newState.actionHistory).toHaveLength(1);
      expect(newState.actionHistory[0]).toEqual({
        type: 'guess',
        input: 'elephant',
        response: 'Correct!',
        attemptNumber: 1,
      });
    });

    it('should handle incorrect guess during playing phase', () => {
      const mockAI = new MockAIService('elephant');
      const state = initializeGame(mockAI);
      const newState = processGuess(state, 'lion', mockAI);

      expect(newState.gameStatus).toBe('playing');
      expect(newState.remainingAttempts).toBe(19);
      expect(newState.actionHistory).toHaveLength(1);
      expect(newState.actionHistory[0].response).toBe('Incorrect');
    });

    it('should be case-insensitive for guesses', () => {
      const mockAI = new MockAIService('elephant');
      const state = initializeGame(mockAI);
      const newState = processGuess(state, 'ELEPHANT', mockAI);

      expect(newState.gameStatus).toBe('won');
    });

    it('should trim whitespace from guesses', () => {
      const mockAI = new MockAIService('elephant');
      const state = initializeGame(mockAI);
      const newState = processGuess(state, '  elephant  ', mockAI);

      expect(newState.gameStatus).toBe('won');
    });

    it('should not process empty guesses', () => {
      const mockAI = new MockAIService('elephant');
      const state = initializeGame(mockAI);
      const newState = processGuess(state, '   ', mockAI);

      expect(newState.remainingAttempts).toBe(20);
      expect(newState.actionHistory).toHaveLength(0);
    });

    it('should transition to finalGuess after last incorrect guess', () => {
      const mockAI = new MockAIService('elephant');
      const state = { ...initializeGame(mockAI), remainingAttempts: 1 };

      const newState = processGuess(state, 'lion', mockAI);

      expect(newState.gameStatus).toBe('finalGuess');
      expect(newState.remainingAttempts).toBe(0);
    });

    it('should handle final guess win', () => {
      const mockAI = new MockAIService('elephant');
      const state = {
        ...initializeGame(mockAI),
        gameStatus: 'finalGuess' as const,
        remainingAttempts: 0,
        actionHistory: Array(20).fill(null).map((_, i) => ({
          type: 'question' as const,
          input: `Question ${i + 1}`,
          response: 'No',
          attemptNumber: i + 1,
        })),
      };

      const newState = processGuess(state, 'elephant', mockAI);

      expect(newState.gameStatus).toBe('won');
      expect(newState.actionHistory).toHaveLength(21);
      expect(newState.actionHistory[20].attemptNumber).toBe(21);
    });

    it('should handle final guess loss', () => {
      const mockAI = new MockAIService('elephant');
      const state = {
        ...initializeGame(mockAI),
        gameStatus: 'finalGuess' as const,
        remainingAttempts: 0,
      };

      const newState = processGuess(state, 'lion', mockAI);

      expect(newState.gameStatus).toBe('lost');
    });

    it('should not process guesses when game is won', () => {
      const mockAI = new MockAIService('elephant');
      const state: GameState = {
        ...initializeGame(mockAI),
        gameStatus: 'won',
      };
      const newState = processGuess(state, 'something', mockAI);

      expect(newState.actionHistory).toHaveLength(0);
    });

    it('should not process guesses when game is lost', () => {
      const mockAI = new MockAIService('elephant');
      const state: GameState = {
        ...initializeGame(mockAI),
        gameStatus: 'lost',
      };
      const newState = processGuess(state, 'something', mockAI);

      expect(newState.actionHistory).toHaveLength(0);
    });
  });

  describe('Complete game flow', () => {
    it('should handle a winning game flow', () => {
      const mockAI = new MockAIService('elephant', () => true);
      let state = initializeGame(mockAI);

      // Ask some questions
      state = processQuestion(state, 'Is it alive?', mockAI);
      state = processQuestion(state, 'Is it an animal?', mockAI);
      state = processQuestion(state, 'Is it big?', mockAI);

      expect(state.remainingAttempts).toBe(17);
      expect(state.gameStatus).toBe('playing');

      // Make correct guess
      state = processGuess(state, 'elephant', mockAI);

      expect(state.gameStatus).toBe('won');
      expect(state.actionHistory).toHaveLength(4);
    });

    it('should handle a losing game flow', () => {
      const mockAI = new MockAIService('elephant', () => true, () => 'No');
      let state = initializeGame(mockAI);

      // Use all 20 attempts with questions and guesses
      for (let i = 0; i < 10; i++) {
        state = processQuestion(state, `Question ${i + 1}?`, mockAI);
      }
      for (let i = 0; i < 10; i++) {
        state = processGuess(state, `guess${i + 1}`, mockAI);
      }

      expect(state.remainingAttempts).toBe(0);
      expect(state.gameStatus).toBe('finalGuess');

      // Make final incorrect guess
      state = processGuess(state, 'lion', mockAI);

      expect(state.gameStatus).toBe('lost');
      expect(state.actionHistory).toHaveLength(21);
    });

    it('should handle mixed questions and guesses', () => {
      const mockAI = new MockAIService('elephant', () => true);
      let state = initializeGame(mockAI);

      state = processQuestion(state, 'Is it alive?', mockAI);
      state = processGuess(state, 'lion', mockAI);
      state = processQuestion(state, 'Is it big?', mockAI);
      state = processGuess(state, 'tiger', mockAI);

      expect(state.remainingAttempts).toBe(16);
      expect(state.actionHistory).toHaveLength(4);
      expect(state.actionHistory[0].type).toBe('question');
      expect(state.actionHistory[1].type).toBe('guess');
      expect(state.actionHistory[2].type).toBe('question');
      expect(state.actionHistory[3].type).toBe('guess');
    });
  });

  describe('Default AI Service', () => {
    it('should validate yes/no questions correctly', () => {
      const state = initializeGame();
      
      // These should be valid yes/no questions
      const validQuestions = [
        'Is it alive?',
        'Does it have legs?',
        'Can it fly?',
        'Will it fit in a box?',
        'Has it been to space?',
      ];

      validQuestions.forEach(q => {
        const newState = processQuestion(state, q);
        expect(newState.actionHistory[newState.actionHistory.length - 1].response).not.toBe('Invalid question');
      });
    });

    it('should reject non-yes/no questions', () => {
      let state = initializeGame();
      
      // These should be invalid
      const invalidQuestions = [
        'What is it?',
        'How big is it?',
        'Where does it live?',
        'Why is it here?',
      ];

      invalidQuestions.forEach((q, index) => {
        state = processQuestion(state, q);
        expect(state.actionHistory[index].response).toBe('Invalid question');
      });
    });

    it('should provide consistent answers for same questions', () => {
      const state1 = initializeGame();
      const state2 = initializeGame();
      
      // Set same secret answer
      state2.secretAnswer = state1.secretAnswer;

      const question = 'Is it alive?';
      const result1 = processQuestion(state1, question);
      const result2 = processQuestion(state2, question);

      // Should get same response for same answer
      expect(result1.actionHistory[0].response).toBe(result2.actionHistory[0].response);
    });
  });
});
