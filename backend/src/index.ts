import Fastify from 'fastify';
import cors from '@fastify/cors';
import { scoresRoutes } from './routes/scores';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  // Register CORS
  await app.register(cors, {
    origin: true, // Allow all origins in development
  });

  // Register routes
  await app.register(scoresRoutes);

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    await app.listen({ port: PORT, host: HOST });
    console.log(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  start();
}
