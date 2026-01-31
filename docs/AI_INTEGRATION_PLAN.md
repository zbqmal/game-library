# AI Integration Plan for Twenty Questions Game

## Current Status

The Twenty Questions game is **fully functional** with a simulated AI service. The current implementation:

✅ Works without any external dependencies  
✅ Provides a good gameplay experience  
✅ Uses an `AIService` interface abstraction  
✅ Can be easily upgraded to real AI  

## Architecture Design

The game uses the **Strategy Pattern** with an `AIService` interface:

```typescript
export interface AIService {
  selectAnswer: () => string;
  isYesNoQuestion: (question: string) => boolean;
  answerQuestion: (question: string, answer: string) => 'Yes' | 'No';
  isCorrectGuess: (guess: string, answer: string) => boolean;
}
```

**Current Implementation**: `SimulatedAIService` (keyword-based matching)  
**Future Implementation**: `LLMAIService` (OpenAI/Anthropic/etc.)

## Option 1: Keep Current Implementation (Recommended for MVP)

**Pros:**
- ✅ Zero external costs
- ✅ No API rate limits
- ✅ Instant responses
- ✅ Works offline
- ✅ No security concerns with API keys
- ✅ Predictable behavior for testing

**Cons:**
- ❌ Limited question understanding
- ❌ Keyword-based responses may seem simplistic
- ❌ Fixed answer pool (30 nouns)

**Use Case**: Perfect for a public demo/MVP where you want to avoid API costs and complexity.

## Option 2: Real AI Integration (Future Enhancement)

### Implementation Approach

#### Step 1: Add Environment Variables
```bash
# .env.local
OPENAI_API_KEY=sk-...
# or
ANTHROPIC_API_KEY=sk-ant-...
```

#### Step 2: Create Next.js API Routes

**`/app/api/ai/select-answer/route.ts`**
```typescript
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST() {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "Generate a single common concrete noun for a guessing game. Reply with only the noun, nothing else."
    }],
    temperature: 1.0,
  });
  
  const answer = completion.choices[0].message.content?.trim().toLowerCase();
  return NextResponse.json({ answer });
}
```

**`/app/api/ai/validate-question/route.ts`**
```typescript
export async function POST(request: Request) {
  const { question } = await request.json();
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "Determine if this question can be answered with only 'Yes' or 'No'. Reply with only 'true' or 'false'."
    }, {
      role: "user",
      content: question
    }],
  });
  
  const isValid = completion.choices[0].message.content?.trim() === 'true';
  return NextResponse.json({ isValid });
}
```

**`/app/api/ai/answer-question/route.ts`**
```typescript
export async function POST(request: Request) {
  const { question, answer } = await request.json();
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: `You are playing Twenty Questions. The secret answer is "${answer}". Answer the following yes/no question accurately. Reply with only "Yes" or "No".`
    }, {
      role: "user",
      content: question
    }],
  });
  
  const response = completion.choices[0].message.content?.trim();
  return NextResponse.json({ response });
}
```

#### Step 3: Create LLMAIService

**`/app/games/twenty-questions/llmAIService.ts`**
```typescript
import { AIService } from './gameLogic';

export class LLMAIService implements AIService {
  async selectAnswer(): Promise<string> {
    const response = await fetch('/api/ai/select-answer', {
      method: 'POST',
    });
    const data = await response.json();
    return data.answer;
  }

  async isYesNoQuestion(question: string): Promise<boolean> {
    const response = await fetch('/api/ai/validate-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await response.json();
    return data.isValid;
  }

  async answerQuestion(question: string, answer: string): Promise<'Yes' | 'No'> {
    const response = await fetch('/api/ai/answer-question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer }),
    });
    const data = await response.json();
    return data.response;
  }

  isCorrectGuess(guess: string, answer: string): boolean {
    return guess.toLowerCase().trim() === answer.toLowerCase().trim();
  }
}
```

#### Step 4: Update Game Logic

Make `AIService` methods async and update the interface:

```typescript
export interface AIService {
  selectAnswer: () => Promise<string> | string;
  isYesNoQuestion: (question: string) => Promise<boolean> | boolean;
  answerQuestion: (question: string, answer: string) => Promise<'Yes' | 'No'> | 'Yes' | 'No';
  isCorrectGuess: (guess: string, answer: string) => boolean;
}
```

Update game functions to handle async operations:

```typescript
export async function processQuestion(
  state: GameState,
  question: string,
  customAIService?: AIService
): Promise<GameState> {
  // ... make async calls to AI service
}
```

#### Step 5: Update UI Component

Update `page.tsx` to handle async state updates:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!gameState || !inputValue.trim()) return;
  
  setIsProcessing(true); // Add loading state
  
  try {
    if (gameState.currentAction === 'question') {
      const newState = await processQuestion(gameState, inputValue);
      setGameState(newState);
    } else if (gameState.currentAction === 'guess') {
      const newState = await processGuess(gameState, inputValue);
      setGameState(newState);
    }
  } finally {
    setIsProcessing(false);
    setInputValue("");
  }
};
```

### Required Dependencies

```bash
npm install openai
# or
npm install @anthropic-ai/sdk
```

### Estimated Costs (OpenAI GPT-4)

- **Answer selection**: ~$0.01 per game
- **Question validation**: ~$0.005 per question
- **Question answering**: ~$0.01 per question
- **Total per game**: ~$0.20-0.40 (assuming 20 questions)

### Security Considerations

1. **API Keys**: Never expose API keys in client-side code
2. **Rate Limiting**: Implement rate limiting on API routes
3. **Input Validation**: Sanitize user inputs before sending to LLM
4. **Caching**: Cache common questions/answers to reduce costs
5. **Fallback**: Keep simulated AI as fallback if API fails

## Hybrid Approach (Best of Both Worlds)

Create a configuration system that allows switching between AI implementations:

```typescript
// app/games/twenty-questions/config.ts
export const AI_CONFIG = {
  mode: process.env.NEXT_PUBLIC_AI_MODE || 'simulated', // 'simulated' | 'llm'
  provider: process.env.NEXT_PUBLIC_AI_PROVIDER || 'openai', // 'openai' | 'anthropic'
};

export function getAIService(): AIService {
  if (AI_CONFIG.mode === 'llm') {
    return new LLMAIService();
  }
  return new SimulatedAIService();
}
```

This allows you to:
- ✅ Start with simulated AI (free, instant)
- ✅ Switch to real AI via environment variable
- ✅ Test both implementations
- ✅ Use simulated AI in development, real AI in production

## Recommendation

**For Initial Launch**: Keep the current simulated AI implementation
- It's fully functional and provides a good user experience
- No external dependencies or costs
- Easy to maintain and test

**For Future Enhancement** (if desired): Create a follow-up PR to add:
1. Optional LLM integration via feature flag
2. API routes for AI operations
3. Environment-based configuration
4. Cost monitoring and rate limiting

## Next Steps

**Option A** (Current): Approve and merge the current PR as-is
- Game is complete and ready to use
- No additional work needed

**Option B** (AI Enhancement): I can create a follow-up PR that:
- Adds real AI integration as described above
- Maintains backward compatibility with simulated AI
- Includes configuration to switch between modes
- Adds proper error handling and fallbacks

Let me know which approach you prefer!
