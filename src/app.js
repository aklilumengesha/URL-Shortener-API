import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

export async function build(opts = {}) {
  const app = Fastify(opts);

  // Register CORS
  await app.register(cors, {
    origin: true,
  });

  // Register Rate Limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });

  // Health check endpoint
  app.get('/health', async (request, reply) => {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  return app;
}
