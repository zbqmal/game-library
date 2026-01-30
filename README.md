# Game Library

A web platform hosting a collection of casual games where players can enjoy quick, fun gameplay without requiring login.

## Live Demo

https://game-library-joonohjoon.vercel.app/

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Search**: Fuse.js for client-side fuzzy search
- **Storage**: localStorage for game scoreboards
- **Testing**: Jest, React Testing Library, Playwright

## Games

### Up And Down

Guess a secret number within a configurable range using limited attempts.

**How to Play**:

1. Choose your game settings (number range and attempt limit)
2. Enter your guesses
3. Receive feedback whether the secret number is higher or lower
4. Win by guessing correctly before running out of attempts

**Features**:

- Configurable number range (1-10000)
- Variable attempt limits (1-100)
- Clear UP/DOWN/WIN feedback

### Rock-Paper-Scissors

Play the classic game against the computer and build consecutive wins for high scores.

**How to Play**:

1. Choose rock, paper, or scissors
2. See the result after a countdown animation
3. Build your consecutive win streak
4. Your score is determined by consecutive wins

**Features**:

- Real-time game outcome animation
- Consecutive win tracking
- Top 10 scoreboard with name entry
- localStorage-based persistence

## Features

- 🎮 Multiple fun mini-games
- 🏆 Game-specific scoreboards
- 📱 Responsive design
- 🔍 Real-time game search
- ⌨️ Keyboard accessible

## Development

### Running Tests

```bash
yarn test          # Run all unit tests with coverage
yarn test:watch    # Run tests in watch mode
yarn test:e2e      # Run end-to-end tests
```

### Continuous Integration

This project includes a GitHub Actions workflow that automatically runs all unit tests on every pull request. 

**To make this workflow required for PR merges:**

1. Go to your repository Settings on GitHub
2. Navigate to "Branches" in the left sidebar
3. Add or edit a branch protection rule for your main branch
4. Enable "Require status checks to pass before merging"
5. Search for and select the "test" status check
6. Save your changes

Once configured, all PRs must pass the test suite before they can be merged.

## License

MIT
