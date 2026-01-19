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
- 🚧 **Phase 2**: Homepage with game grid and search
- 📋 **Phase 3**: Individual game implementations
- 📋 **Phase 4**: Backend API setup
- 📋 **Phase 5**: Database integration
- 📋 **Phase 6**: Additional games

## Games

### Planned Games

1. **Number Guessing Game** - Guess the secret number with limited attempts
2. **Rock-Paper-Scissors** - Play against the computer for consecutive wins
3. **Stairs Game** - Climb stairs and win mini-games for high scores

## Contributing

This is a personal project but suggestions and feedback are welcome!

## License

MIT
