# Twenty Questions Game

A single-player guessing game where the AI thinks of a noun and the player tries to guess it within 20 attempts using yes/no questions or direct guesses.

## Current Implementation

### Architecture

The game uses a **clean architecture pattern** with an abstracted AI service:

```
┌─────────────────────────────────────┐
│         UI Layer (page.tsx)         │
│  - Action selection                 │
│  - Input handling                   │
│  - History display                  │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│      Game Logic (gameLogic.ts)      │
│  - State management                 │
│  - Turn processing                  │
│  - Win/lose conditions              │
└───────────────┬─────────────────────┘
                │
┌───────────────▼─────────────────────┐
│     AI Service Interface            │
│  ┌──────────────────────────────┐   │
│  │  SimulatedAIService (current)│   │
│  │  - Keyword-based responses   │   │
│  │  - 30 predefined nouns       │   │
│  └──────────────────────────────┘   │
│  ┌──────────────────────────────┐   │
│  │  LLMAIService (future)       │   │
│  │  - OpenAI/Anthropic          │   │
│  │  - Natural language          │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

### AIService Interface

```typescript
export interface AIService {
  selectAnswer: () => string;
  isYesNoQuestion: (question: string) => boolean;
  answerQuestion: (question: string, answer: string) => 'Yes' | 'No';
  isCorrectGuess: (guess: string, answer: string) => boolean;
}
```

This interface makes it **trivial to swap AI implementations** without changing any game logic.

## Features

### Current Features (Simulated AI)

✅ **Answer Selection**: Randomly selects from 30 diverse nouns  
✅ **Question Validation**: Checks if questions are yes/no answerable  
✅ **Smart Responses**: Keyword-based matching for common question types:
- Living vs non-living
- Edible vs inedible  
- Size (big/small)
- Natural vs man-made
- Technology-related
- Musical instruments
- Water-related
- Sky/space-related

✅ **Guess Validation**: Case-insensitive with whitespace trimming  
✅ **Attempt Tracking**: 20 attempts limit with final guess phase  
✅ **Action History**: Complete log of all questions and guesses  
✅ **Win/Loss Conditions**: Immediate win on correct guess, loss after failed final guess  

### Game Flow

1. **Start**: AI secretly selects a noun
2. **Playing Phase** (up to 20 attempts):
   - Player chooses: Ask Question OR Make Guess
   - Question: AI validates and responds Yes/No or "Invalid question"
   - Guess: AI checks if correct
   - Correct guess → Instant Win
3. **Final Guess Phase**: After 20 attempts, one last guess allowed
4. **Game Over**: Show win/loss message and reveal answer

## Testing

The game includes **comprehensive test coverage**:

- **55 test cases** covering all scenarios
- **86.2% statement coverage** for game logic
- **94% statement coverage** for UI component

### Test Categories

- Game initialization
- Action selection (Question vs Guess)
- Question processing (valid/invalid)
- Guess processing (correct/incorrect)
- Attempt tracking
- Final guess phase
- Win/loss conditions
- Complete game flows

## Future Enhancement: Real AI Integration

See [AI Integration Plan](../../docs/AI_INTEGRATION_PLAN.md) for detailed documentation on how to upgrade to real LLM-based AI.

### Quick Summary

**To enable real AI:**

1. Add API key to environment variables
2. Install AI SDK: `npm install openai`
3. Create API routes in `/app/api/ai/`
4. Implement `LLMAIService` class
5. Update interface to support async operations
6. Add loading states to UI

**Benefits of real AI:**
- ✅ Unlimited answer variety
- ✅ Better question understanding
- ✅ More natural interactions
- ✅ Can handle complex questions

**Trade-offs:**
- ❌ API costs (~$0.20-0.40 per game)
- ❌ Network latency
- ❌ Requires API key management
- ❌ Rate limiting concerns

## Why Simulated AI First?

1. **No dependencies**: Works immediately without setup
2. **Zero cost**: No API fees
3. **Fast**: Instant responses
4. **Predictable**: Easy to test and debug
5. **Offline**: Works without internet
6. **Production-ready**: Provides good user experience

The simulated AI is **not a placeholder**—it's a fully functional implementation suitable for production use. Real AI integration is an **optional enhancement** for teams that want more sophisticated natural language understanding.

## Files

```
app/games/twenty-questions/
├── gameLogic.ts           # Core game logic + AI interface
├── page.tsx               # React UI component
└── __tests__/
    ├── gameLogic.test.ts  # 40 logic tests
    └── page.test.tsx      # 15 UI tests
```

## Usage Example

```typescript
import { initializeGame, processQuestion, processGuess } from './gameLogic';

// Start game
let state = initializeGame();

// Ask a question
state = processQuestion(state, "Is it alive?");
// AI responds: "Yes" | "No" | "Invalid question"

// Make a guess
state = processGuess(state, "elephant");
// state.gameStatus: 'won' | 'playing' | 'finalGuess' | 'lost'
```

## Contributing

To add new answer types or improve keyword matching, edit the `SimulatedAIService` class in `gameLogic.ts`.

To implement real AI, follow the [AI Integration Plan](../../docs/AI_INTEGRATION_PLAN.md).
