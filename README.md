# 🎮 Game Library

A modern **monorepo** featuring a collection of simple and enjoyable games with a Next.js frontend, Fastify backend API, and shared TypeScript types.

## 📐 Architecture

This project uses a monorepo structure with pnpm workspaces:

- **`/apps/web`** - Next.js frontend with TypeScript
- **`/apps/api`** - Fastify backend API with TypeScript
- **`/packages/shared`** - Shared TypeScript types and utilities

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies for all workspaces
pnpm install
```

### Running Locally

**Run both frontend and backend concurrently:**
```bash
pnpm dev
```

**Or run them separately:**

```bash
# Run frontend only (http://localhost:3000)
pnpm dev:web

# Run backend only (http://localhost:3001)
pnpm dev:api
```

### Environment Setup

#### Backend API & Database

The API requires a PostgreSQL database. We recommend using [Supabase](https://supabase.com) for development and production.

1. Create a `.env` file in `apps/api/` based on `.env.example`:
   ```bash
   cd apps/api
   cp .env.example .env
   ```

2. Set your `DATABASE_URL` in `apps/api/.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/game_library"
   ```

3. Run Prisma migrations:
   ```bash
   cd apps/api
   pnpm prisma migrate dev
   ```

See `apps/api/prisma/README.md` for more details on database setup and migrations.

## 🎲 Games

### Up and Down
- You have 5 chances to guess a random number between 0 and 100
- Get hints as "Up" or "Down" based on your guess

## 🛠️ Development Scripts

```bash
# Build all packages
pnpm build

# Lint all packages
pnpm lint

# Type check all packages
pnpm typecheck

# Run tests (placeholder)
pnpm test

# Format code with Prettier
pnpm format
```

## 🏗️ Project Structure

```
game-library/
├── apps/
│   ├── web/           # Next.js frontend
│   │   ├── pages/
│   │   ├── components/
│   │   └── styles/
│   └── api/           # Fastify backend
│       ├── src/
│       │   ├── server.ts
│       │   └── routes/
│       └── prisma/
│           └── schema.prisma
├── packages/
│   └── shared/        # Shared TypeScript types
│       └── src/
│           └── types.ts
├── .github/
│   └── workflows/     # GitHub Actions CI
├── pnpm-workspace.yaml
└── package.json
```

## 🚢 Deployment

### Frontend (Vercel)

The Next.js frontend (`apps/web`) can be deployed to [Vercel](https://vercel.com):

1. Connect your GitHub repository to Vercel
2. Set the root directory to `apps/web`
3. Vercel will automatically detect Next.js and configure build settings

### Backend (Render)

The Fastify backend (`apps/api`) can be deployed to [Render](https://render.com):

1. Create a new Web Service on Render
2. Set the root directory to `apps/api`
3. Set build command: `pnpm install && pnpm build`
4. Set start command: `pnpm start`
5. Add environment variable: `DATABASE_URL` (your Supabase or PostgreSQL connection string)

### Database (Supabase)

We recommend [Supabase](https://supabase.com) for managed PostgreSQL:

1. Create a new project on Supabase
2. Copy the connection string from Settings > Database
3. Use this as your `DATABASE_URL` environment variable

## 🧪 Testing

Test infrastructure is set up but tests are currently placeholders. Contributions welcome!

## 🤝 Contributing

This is an initial scaffold. Future development should extend:
- Additional game implementations
- Real authentication/authorization
- Comprehensive test coverage
- Additional API endpoints as needed

## 📝 License

Private project.
