# Prisma Database Setup

This directory contains the Prisma schema and migrations for the Game Library API.

## Initial Setup

### 1. Set up your database

Create a PostgreSQL database. We recommend using [Supabase](https://supabase.com) for easy setup:

1. Go to https://supabase.com and create a new project
2. Once created, go to Settings > Database
3. Copy the "Connection string" (use "Transaction" mode for Prisma)

### 2. Configure environment variables

Create a `.env` file in the `apps/api` directory:

```bash
cd apps/api
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```
DATABASE_URL="postgresql://user:password@host:5432/database?schema=public"
```

### 3. Generate Prisma Client

```bash
pnpm prisma:generate
```

This generates the Prisma Client based on your schema.

### 4. Run migrations

```bash
pnpm prisma:migrate
```

This creates the database tables based on your Prisma schema.

## Development Workflow

### Create a new migration

After modifying `schema.prisma`:

```bash
pnpm prisma migrate dev --name description_of_changes
```

This will:
1. Create a new migration file
2. Apply it to your database
3. Regenerate Prisma Client

### View your database

```bash
pnpx prisma studio
```

Opens a web interface to view and edit your database.

### Reset the database

⚠️ This will delete all data:

```bash
pnpx prisma migrate reset
```

## Seeding (Optional)

To populate the database with sample data, create a `seed.ts` file and add a seed script to `package.json`:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Then run:

```bash
pnpx prisma db seed
```

## Production

For production deployments:

1. Set `DATABASE_URL` in your hosting environment (e.g., Render, Railway)
2. Run migrations as part of your build:
   ```bash
   pnpm prisma migrate deploy
   ```

## Learn More

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
