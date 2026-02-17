import Fastify from 'fastify';
import cors from '@fastify/cors';

export async function build(opts = {}) {
  const app = Fastify(opts);

  // Register CORS
  await app.register(cors, {
    origin: true,
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
