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

## License

MIT
