/**
 * Twenty Questions Game Logic
 * 
 * A guessing game where the player tries to identify a noun selected by the AI
 * using yes/no questions or direct guesses within 20 attempts.
 */

export type ActionType = 'question' | 'guess';

export interface ActionHistoryItem {
  type: ActionType;
  input: string;
  response: string;
  attemptNumber: number;
}

export interface GameState {
  secretAnswer: string;
  remainingAttempts: number;
  gameStatus: 'playing' | 'won' | 'lost' | 'finalGuess';
  actionHistory: ActionHistoryItem[];
  currentAction: ActionType | null;
}

/**
 * AI Service Interface - Abstraction for AI logic
 * This allows for easy replacement with real AI service later
 */
export interface AIService {
  selectAnswer: () => string;
  isYesNoQuestion: (question: string) => boolean;
  answerQuestion: (question: string, answer: string) => 'Yes' | 'No';
  isCorrectGuess: (guess: string, answer: string) => boolean;
}

/**
 * Simulated AI Service
 * This is a placeholder implementation that can be replaced with real AI
 */
class SimulatedAIService implements AIService {
  private readonly answers = [
    'elephant', 'pizza', 'guitar', 'mountain', 'ocean', 
    'computer', 'airplane', 'diamond', 'rainbow', 'chocolate',
    'basketball', 'camera', 'sunflower', 'lighthouse', 'telescope',
    'volcano', 'penguin', 'waterfall', 'bicycle', 'butterfly',
    'castle', 'dragon', 'forest', 'galaxy', 'harmonica',
    'iceberg', 'jaguar', 'keyboard', 'lemon', 'microscope'
  ];

  selectAnswer(): string {
    return this.answers[Math.floor(Math.random() * this.answers.length)];
  }

  isYesNoQuestion(question: string): boolean {
    // Check for common yes/no question patterns
    const lowerQuestion = question.toLowerCase().trim();
    
    // Questions that start with common yes/no words
    const yesNoStarters = [
      'is', 'are', 'do', 'does', 'can', 'could', 'would', 'will',
      'should', 'has', 'have', 'was', 'were', 'am'
    ];
    
    // Check if question starts with yes/no pattern
    const startsWithYesNo = yesNoStarters.some(starter => 
      lowerQuestion.startsWith(starter + ' ')
    );
    
    // Questions with "or" are typically not yes/no questions
    const hasOrChoice = lowerQuestion.includes(' or ');
    
    // Check for wh-words (what, when, where, who, why, how) which are not yes/no
    const whWords = ['what', 'when', 'where', 'who', 'why', 'how', 'which'];
    const startsWithWh = whWords.some(word => 
      lowerQuestion.startsWith(word + ' ') || lowerQuestion.startsWith(word + "'")
    );
    
    return startsWithYesNo && !hasOrChoice && !startsWithWh;
  }

  answerQuestion(question: string, answer: string): 'Yes' | 'No' {
    // Simulate answering based on question content and answer
    const lowerQuestion = question.toLowerCase();
    const lowerAnswer = answer.toLowerCase();
    
    // Simple keyword matching for demonstration
    // In a real AI implementation, this would use NLP/LLM
    
    // Check for living/animal questions
    if (lowerQuestion.includes('living') || lowerQuestion.includes('alive')) {
      const livingThings = ['elephant', 'penguin', 'jaguar', 'butterfly', 'sunflower', 'dragon'];
      return livingThings.includes(lowerAnswer) ? 'Yes' : 'No';
    }
    
    // Check for edible questions
    if (lowerQuestion.includes('eat') || lowerQuestion.includes('food') || lowerQuestion.includes('edible')) {
      const edible = ['pizza', 'chocolate', 'lemon'];
      return edible.includes(lowerAnswer) ? 'Yes' : 'No';
    }
    
    // Check for size questions
    if (lowerQuestion.includes('big') || lowerQuestion.includes('large')) {
      const large = ['elephant', 'mountain', 'ocean', 'airplane', 'volcano', 'iceberg', 'castle', 'forest', 'galaxy'];
      return large.includes(lowerAnswer) ? 'Yes' : 'No';
    }
    
    // Check for natural vs man-made
    if (lowerQuestion.includes('natural') || lowerQuestion.includes('nature')) {
      const natural = ['elephant', 'mountain', 'ocean', 'rainbow', 'sunflower', 'waterfall', 'penguin', 'butterfly', 'volcano', 'iceberg', 'jaguar', 'forest', 'galaxy', 'lemon'];
      return natural.includes(lowerAnswer) ? 'Yes' : 'No';
    }
    
    if (lowerQuestion.includes('man-made') || lowerQuestion.includes('manmade') || lowerQuestion.includes('artificial')) {
      const manMade = ['pizza', 'guitar', 'computer', 'airplane', 'diamond', 'basketball', 'camera', 'lighthouse', 'telescope', 'bicycle', 'castle', 'harmonica', 'keyboard', 'microscope', 'chocolate'];
      return manMade.includes(lowerAnswer) ? 'Yes' : 'No';
    }
    
    // Check for technology
    if (lowerQuestion.includes('technology') || lowerQuestion.includes('electronic') || lowerQuestion.includes('digital')) {
      const tech = ['computer', 'camera', 'telescope', 'keyboard', 'microscope'];
      return tech.includes(lowerAnswer) ? 'Yes' : 'No';
    }
    
    // Check for musical
    if (lowerQuestion.includes('music') || lowerQuestion.includes('instrument')) {
      const musical = ['guitar', 'harmonica'];
      return musical.includes(lowerAnswer) ? 'Yes' : 'No';
    }
    
    // Check for water-related
    if (lowerQuestion.includes('water')) {
      const waterRelated = ['ocean', 'waterfall', 'iceberg'];
      return waterRelated.includes(lowerAnswer) ? 'Yes' : 'No';
    }
    
    // Check for sky/space
    if (lowerQuestion.includes('sky') || lowerQuestion.includes('space') || lowerQuestion.includes('air') || lowerQuestion.includes('fly')) {
      const skyRelated = ['airplane', 'rainbow', 'galaxy', 'telescope'];
      return skyRelated.includes(lowerAnswer) ? 'Yes' : 'No';
    }
    
    // Default random response for unknown questions
    return Math.random() > 0.5 ? 'Yes' : 'No';
  }

  isCorrectGuess(guess: string, answer: string): boolean {
    // Case-insensitive comparison, allowing for minor variations
    const normalizedGuess = guess.toLowerCase().trim();
    const normalizedAnswer = answer.toLowerCase().trim();
    
    return normalizedGuess === normalizedAnswer;
  }
}

// Export singleton instance
export const aiService: AIService = new SimulatedAIService();

/**
 * Initialize a new game
 */
export function initializeGame(customAIService?: AIService): GameState {
  const ai = customAIService || aiService;
  
  return {
    secretAnswer: ai.selectAnswer(),
    remainingAttempts: 20,
    gameStatus: 'playing',
    actionHistory: [],
    currentAction: null,
  };
}

/**
 * Set the current action type (question or guess)
 */
export function setAction(state: GameState, action: ActionType): GameState {
  if (state.gameStatus !== 'playing' && state.gameStatus !== 'finalGuess') {
    return state;
  }
  
  return {
    ...state,
    currentAction: action,
  };
}

/**
 * Process a question from the player
 */
export function processQuestion(
  state: GameState,
  question: string,
  customAIService?: AIService
): GameState {
  if (state.gameStatus !== 'playing') {
    return state;
  }
  
  if (!question.trim()) {
    return state;
  }
  
  const ai = customAIService || aiService;
  
  // Validate if it's a yes/no question
  const isValid = ai.isYesNoQuestion(question);
  
  let response: string;
  if (isValid) {
    response = ai.answerQuestion(question, state.secretAnswer);
  } else {
    response = 'Invalid question';
  }
  
  const newRemainingAttempts = state.remainingAttempts - 1;
  const attemptNumber = 20 - state.remainingAttempts + 1;
  
  const newHistory: ActionHistoryItem = {
    type: 'question',
    input: question,
    response,
    attemptNumber,
  };
  
  // Check if this was the last attempt
  let newStatus: GameState['gameStatus'] = 'playing';
  if (newRemainingAttempts === 0) {
    newStatus = 'finalGuess';
  }
  
  return {
    ...state,
    remainingAttempts: newRemainingAttempts,
    actionHistory: [...state.actionHistory, newHistory],
    currentAction: null,
    gameStatus: newStatus,
  };
}

/**
 * Process a guess from the player
 */
export function processGuess(
  state: GameState,
  guess: string,
  customAIService?: AIService
): GameState {
  if (state.gameStatus !== 'playing' && state.gameStatus !== 'finalGuess') {
    return state;
  }
  
  if (!guess.trim()) {
    return state;
  }
  
  const ai = customAIService || aiService;
  const isCorrect = ai.isCorrectGuess(guess, state.secretAnswer);
  
  const attemptNumber = state.gameStatus === 'finalGuess' 
    ? 21  // Final guess after 20 attempts
    : 20 - state.remainingAttempts + 1;
  
  const newHistory: ActionHistoryItem = {
    type: 'guess',
    input: guess,
    response: isCorrect ? 'Correct!' : 'Incorrect',
    attemptNumber,
  };
  
  if (isCorrect) {
    return {
      ...state,
      actionHistory: [...state.actionHistory, newHistory],
      currentAction: null,
      gameStatus: 'won',
    };
  }
  
  // If this was the final guess, game is lost
  if (state.gameStatus === 'finalGuess') {
    return {
      ...state,
      actionHistory: [...state.actionHistory, newHistory],
      currentAction: null,
      gameStatus: 'lost',
    };
  }
  
  // Regular guess during playing - decrement attempts
  const newRemainingAttempts = state.remainingAttempts - 1;
  let newStatus: GameState['gameStatus'] = 'playing';
  
  if (newRemainingAttempts === 0) {
    newStatus = 'finalGuess';
  }
  
  return {
    ...state,
    remainingAttempts: newRemainingAttempts,
    actionHistory: [...state.actionHistory, newHistory],
    currentAction: null,
    gameStatus: newStatus,
  };
}
