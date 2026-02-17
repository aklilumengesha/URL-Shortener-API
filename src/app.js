import Fastify from 'fastify';

export async function build(opts = {}) {
  const app = Fastify(opts);

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
