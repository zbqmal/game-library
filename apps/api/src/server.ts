import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from 'dotenv';
import { gamesRoutes } from './routes/games';
import { scoresRoutes } from './routes/scores';

// Load environment variables
config();

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Create Fastify instance
const fastify = Fastify({
  logger: {
    level: 'info',
  },
});

// Register CORS
fastify.register(cors, {
  origin: true, // Allow all origins in development
});

// Health check endpoint
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Register routes
fastify.register(gamesRoutes, { prefix: '/api' });
fastify.register(scoresRoutes, { prefix: '/api' });

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 API server is running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check: http://${HOST}:${PORT}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
