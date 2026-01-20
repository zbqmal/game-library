# Game Library Backend

Backend API service for the Game Library application. Provides endpoints for storing and retrieving game scores.

## Tech Stack

- **Framework**: Fastify
- **Language**: TypeScript
- **Storage**: JSON file-based persistence
- **Testing**: Jest

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

### Running the Server

#### Development Mode
Start the server with hot-reloading:
```bash
npm run dev
```

The server will start on `http://localhost:3001` by default.

#### Production Mode
Build and run the production server:
```bash
npm run build
npm start
```

### Environment Variables

- `PORT` - Server port (default: 3001)
- `HOST` - Server host (default: 0.0.0.0)

Example:
```bash
PORT=4000 npm run dev
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server health status.

**Response:**
```json
{
  "status": "ok"
}
```

### Get Top 10 Scores
```
GET /scores/:gameId/top10
```
Retrieves the top 10 scores for a specific game, sorted by score (descending).

**Parameters:**
- `gameId` - Game identifier (e.g., "rock-paper-scissors")

**Response:**
```json
{
  "scores": [
    {
      "name": "Alice",
      "score": 200,
      "timestamp": 1705708800000
    },
    {
      "name": "Bob",
      "score": 150,
      "timestamp": 1705708900000
    }
  ]
}
```

### Save Score
```
POST /scores/:gameId
```
Saves a new score for a specific game.

**Parameters:**
- `gameId` - Game identifier (e.g., "rock-paper-scissors")

**Request Body:**
```json
{
  "name": "Alice",
  "score": 200
}
```

**Validation:**
- `name` - Required string, maximum 50 characters
- `score` - Required non-negative integer

**Response (201 Created):**
```json
{
  "name": "Alice",
  "score": 200,
  "timestamp": 1705708800000
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Name must be 50 characters or less"
}
```

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Data Storage

Scores are stored in a JSON file (`scores.json`) in the backend directory. The file is automatically created when the first score is saved.

**Format:**
```json
{
  "game-id": [
    {
      "name": "Player",
      "score": 100,
      "timestamp": 1705708800000
    }
  ]
}
```

**Note:** This is a Phase 4 implementation. A proper database will be integrated in Phase 5.

## Development Notes

- CORS is enabled for all origins in development
- The server keeps the top 100 scores per game to prevent unbounded growth
- Scores are sorted by score (descending), with ties broken by timestamp (earlier is better)

## Future Improvements (Phase 5)

- Database integration (PostgreSQL or MongoDB)
- Authentication and authorization
- Rate limiting
- Score validation and anti-cheat measures
- Pagination for score lists
