# Game Library

A web platform hosting a collection of small, casual games where users can play and compete for high scores.

## Features

- 🎮 Collection of fun mini-games
- 🏆 Scoreboard system for top 10 players
- 📱 Responsive design for all devices
- 🚀 No login required to play

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Node.js (coming in future PR)
- **Database**: To be determined (coming in future PR)

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/zbqmal/game-library.git
cd game-library
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests with coverage
- `npm run test:watch` - Run Jest in watch mode
- `npm run test:e2e` - Run Playwright E2E tests

## Project Structure

```
game-library/
├── app/              # Next.js app directory
│   ├── components/   # React components
│   ├── games/        # Game pages
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Homepage
├── public/           # Static assets
└── package.json      # Dependencies
```

## Development Roadmap

This project is being built incrementally in small PRs:

- ✅ **Phase 1**: Project setup and basic structure
- ✅ **Phase 2**: Homepage with game grid and search
- ✅ **Phase 3**: Individual game implementations (Up And Down, Rock-Paper-Scissors)
- ✅ **Phase 3.1**: UI fixes and refinements
- 🚧 **Phase 4**: Backend API skeleton (scores endpoint + adapter)
- 📋 **Phase 5**: Database integration and full backend migration
- 📋 **Phase 6**: Stairs game implementation
- 📋 **Phase 7**: Additional games

### Phase 2: Homepage with Game Grid and Search

**Goal**: Implement a functional homepage that displays a grid of available games with client-side search capabilities.

**Deliverables**:
- Game metadata source with initial game entries (Number Guessing, Rock-Paper-Scissors, Stairs)
- Responsive game grid with thumbnail cards
- Client-side fuzzy search using Fuse.js
- Accessible, keyboard-navigable UI components
- Unit tests for core components
- E2E test setup with basic smoke tests

**Acceptance Criteria**:
- ✅ Homepage displays a responsive grid of game cards with thumbnails and titles
- ✅ Search bar filters games in real-time with debouncing (200ms)
- ✅ Game tiles are keyboard-accessible and clickable
- ✅ Images lazy-load and have proper alt text
- ✅ Scoreboard badge displays on games that support high scores
- ✅ Unit tests pass for SearchBar and GameGrid components
- ✅ E2E test verifies search filtering and navigation

**Implementation Plan**:
1. Add game metadata module (`app/data/games.ts`)
2. Create reusable components:
   - `GameTile.tsx` - Individual game card
   - `GameGrid.tsx` - Responsive grid container
   - `SearchBar.tsx` - Debounced search input
3. Update homepage to integrate components
4. Add placeholder images for games
5. Implement unit tests using Vitest + React Testing Library
6. Add E2E test with Playwright (or manual verification steps)

**Recommended Technical Choices**:
- **Search**: Fuse.js for fuzzy client-side search (with substring fallback)
- **Metadata**: Local TypeScript module (no backend yet)
- **Images**: WebP placeholders in `public/images/games/`
- **Testing**: Vitest for unit tests, Playwright for E2E

**Branch Naming**: `feature/homepage-grid-search`

**PR Checklist**:
- [ ] All components are TypeScript with proper types
- [ ] Accessibility: Focus outlines, alt text, keyboard navigation
- [ ] Images use lazy loading
- [ ] Search is debounced (200ms)
- [ ] Unit tests pass (`npm run test`)
- [ ] E2E tests pass or manual verification documented
- [ ] Build succeeds (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] README updated with Phase 2 details

**Notes for Future Work**:
- Phase 3 will implement actual game pages at routes specified in metadata
- Backend integration (Phase 4) will replace local metadata with API calls
- Scoreboard functionality will be added in Phase 4-5

### Phase 3: Individual Game Implementations

**Goal**: Implement Up And Down and Rock-Paper-Scissors games with frontend-only scoreboards using localStorage.

**Deliverables**:
- Up And Down game with configurable range and attempts
- Rock-Paper-Scissors game with countdown animation and consecutive win tracking
- Shared components: GameShell, Scoreboard, NameInputModal, Countdown
- Scoreboard adapter with localStorage persistence (adapter pattern for easy backend migration)
- Comprehensive Jest tests for game logic and components
- Migration from Vitest to Jest (user preference)

**Acceptance Criteria**:
- ✅ Up And Down page is functional with UP/DOWN/CONGRATS messages and retry
- ✅ RPS page tracks consecutive wins and persists Top-10 scores to localStorage
- ✅ Scoreboard displays Top-10 scores from localStorage
- ✅ All Jest tests pass with good coverage
- ✅ Code passes linting and TypeScript compilation
- ✅ Games are playable and match specifications

**Testing**:
```bash
# Run all Jest tests
npm test

# Run Jest in watch mode
npm run test:watch

# Run tests with coverage report
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

**Playing the Games**:
1. Start the dev server: `npm run dev`
2. Navigate to http://localhost:3000
3. Click on "Up And Down" or "Rock-Paper-Scissors" tiles
4. Play the games and check scoreboards (RPS only)

**Branch**: `feature/games-phase3`

**Notes**:
- Stairs game will be implemented in a separate PR (Phase 6)
- Scoreboard uses localStorage via an adapter pattern for easy backend migration
- Jest replaced Vitest per user preference

### Phase 4: Backend API Skeleton

**Goal**: Provide a lightweight Node.js backend service (Fastify) that exposes endpoints for storing and retrieving game scores, plus a frontend adapter to call the API.

**Deliverables**:
- Backend API service with Fastify
- Score storage and retrieval endpoints (GET /scores/:gameId/top10, POST /scores/:gameId)
- JSON file-based persistence for Phase 4 (Phase 5 will add database)
- Frontend API adapter implementing the same interface as localStorage adapter
- Jest tests for backend routes
- Comprehensive documentation

**Backend Setup**:
```bash
cd backend
npm install
npm run dev  # Start backend on http://localhost:3001
```

**Backend Testing**:
```bash
cd backend
npm test
```

**API Endpoints**:
- `GET /health` - Health check
- `GET /scores/:gameId/top10` - Get top 10 scores for a game
- `POST /scores/:gameId` - Save a new score (body: `{ name: string, score: number }`)

**Switching to API Adapter**:

The frontend currently uses localStorage for scoreboard persistence. To switch to the API adapter:

1. Start the backend server (see Backend Setup above)
2. In your component, import the API adapter instead of the localStorage adapter:
```typescript
// Before (using localStorage):
import { scoreboardAdapter } from '@/app/lib/scoreboard';

// After (using API):
import { apiScoreboardAdapter } from '@/app/lib/scoreboardApiAdapter';
```

3. Note: The API adapter methods are async, so you'll need to handle promises:
```typescript
// localStorage (synchronous):
const scores = scoreboardAdapter.getTopScores(gameId);

// API (asynchronous):
const scores = await apiScoreboardAdapter.getTopScores(gameId);
```

**Acceptance Criteria**:
- ✅ Backend runs locally and exposes score endpoints
- ✅ Backend tests pass with good coverage
- ✅ Frontend API adapter compiles and can be imported
- ✅ Input validation (name max 50 chars, score >= 0)
- ✅ Documentation includes setup and usage instructions

**Branch**: `feature/backend-api`

**Notes**:
- Phase 4 uses simple JSON file storage; Phase 5 will add database integration
- CORS is enabled for development
- The API adapter is available but not connected to UI (requires async refactoring)

## Games

### Planned Games

1. **Up And Down** - Guess the secret number with limited attempts
2. **Rock-Paper-Scissors** - Play against the computer for consecutive wins
3. **Stairs Game** - Climb stairs and win mini-games for high scores

## Contributing

This is a personal project but suggestions and feedback are welcome!

## License

MIT
