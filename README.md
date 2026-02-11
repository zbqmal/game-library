# Game Library

A web platform hosting a collection of casual games where players can enjoy quick, fun gameplay without requiring login.

## Live Demo

https://game-library-joonohjoon.vercel.app/

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Search**: Fuse.js for client-side fuzzy search
- **Storage**: Firebase Firestore for game scoreboards and analytics
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

### Treasure Hunt

Players take turns uncovering tiles to find the hidden treasure on a grid.

**How to Play**:

1. Configure your game (2-6 players, 3x3 to 6x6 grid)
2. Customize player names (optional)
3. Players take turns clicking tiles to uncover them
4. The player who finds the treasure wins!

**Features**:

- Local multiplayer support (2-6 players)
- **Online multiplayer** - play with friends on different devices
- Configurable grid sizes (3x3 to 6x6)
- Custom player names (up to 20 characters)
- Turn-based gameplay
- Real-time synchronization for online games

**Online Multiplayer**:

To play online with friends:

1. Click "Play Online Multiplayer" button
2. Create a room or join with a 6-character room code
3. Share the room code with your friends
4. Host starts the game when everyone has joined
5. Players take turns clicking tiles across different devices
6. Real-time updates keep everyone synchronized

**Room Cleanup**: Inactive rooms are automatically deleted after 1 hour (or 2 hours if a game is in progress) to keep the platform clean.

### 47

A timing challenge where you must stop the timer at exactly 47.0 seconds!

**How to Play**:

1. Click "Start" to begin the timer
2. The timer will be visible for 3 seconds, then fade out
3. Click "Stop" when you think 47.0 seconds have elapsed
4. Try to get as close to exactly 47.0 seconds as possible

**Features**:

- Precise timing measurement
- Timer fade-out for added challenge
- Immediate feedback showing your exact time
- Simple, focused gameplay

## Features

- 🎮 Multiple fun mini-games
- 🏆 Game-specific scoreboards
- 📱 Responsive design
- 🔍 Real-time game search
- ⌨️ Keyboard accessible
- 📊 Daily visit tracking with Firebase Firestore (resets at 00:00:00 EST)
- 🌍 Multi-language support (English, Spanish, Korean)

## Multi-Language Support

The game library supports three languages: English (default), Spanish, and Korean. Users can switch between languages using the dropdown selector in the top-right corner of the header.

**Supported Languages:**
- 🇺🇸 English
- 🇪🇸 Spanish (Español)
- 🇰🇷 Korean (한국어)

**Features:**
- Language preference is persisted in browser localStorage
- All UI text, game titles, and descriptions are translated
- Seamless language switching without page reload
- Automatic detection and loading of saved language preference

**Adding New Languages:**

To add support for a new language, update the `TranslationEngine.ts` file:

1. Add the new language code to the type definition (e.g., `'fr'` for French)
2. Add translations in the `textMappings` object with all required keys
3. Update the `LanguageDropdown` component to include the new option

## Development

### Setup

1. Clone the repository
2. Install dependencies: `npm install` or `yarn install`
3. (Optional) Configure Firebase for visit tracking:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Generate a service account key
   - Create a `.env.local` file in the root directory with:
     ```
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_CLIENT_EMAIL=your-client-email
     FIREBASE_PRIVATE_KEY="your-private-key"
     ```
   - Note: The app will work without Firebase credentials, but visit tracking will not function

4. Run the development server: `npm run dev` or `yarn dev`

### Room Cleanup (Optional)

For online multiplayer, rooms are automatically cleaned up to prevent database clutter. The cleanup API route is available at `/api/rooms/cleanup`.

**Automatic Cleanup with Vercel Cron Jobs:**

To enable automatic room cleanup on Vercel deployments:

1. Create a `vercel.json` file in the root directory:
```json
{
  "crons": [{
    "path": "/api/rooms/cleanup",
    "schedule": "0 * * * *"
  }]
}
```

2. Deploy to Vercel - the cron job will run hourly

**Cleanup Rules:**
- Rooms with status "waiting" or "finished" are deleted after 1 hour of inactivity
- Active games (status "playing") are deleted after 2 hours of inactivity
- "lastActivity" is updated on every player action (join, start, move)

**Manual Cleanup:**

You can also call the cleanup endpoint manually:
```bash
curl https://your-domain.com/api/rooms/cleanup
```

### Visit Count Feature

The homepage displays a daily visit counter that automatically resets at 00:00:00 EST (Eastern Standard Time) every day. This feature uses Firebase Firestore to track and persist visit counts.

**How it works:**
- Each time the homepage is loaded, a visit is recorded
- The counter displays the total number of visits for the current day (EST timezone)
- At midnight EST (00:00:00), the counter automatically resets to zero for the new day
- Visit data is stored in Firebase Firestore under the `analytics/pageVisits` document

**Note:** The visit counter will not function without proper Firebase credentials configured. See the Firebase setup section above for configuration instructions.

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
5. Search for and select "test" (the full name will be "Run Unit Tests / test")
6. Save your changes

Once configured, all PRs must pass the test suite before they can be merged.

## License

MIT
