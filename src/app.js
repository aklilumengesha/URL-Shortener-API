import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

// Plugins
import mongodbPlugin from './plugins/mongodb.js';
import redisPlugin from './plugins/redis.js';

// Routes
import urlRoutes from './routes/urls.js';

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

  // Register Database Plugins
  await app.register(mongodbPlugin);
  await app.register(redisPlugin);

  // Register Routes
  await app.register(urlRoutes, { prefix: '/api/urls' });

  // Health check endpoint
  app.get('/health', async (request, reply) => {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Redirect route - must be last to avoid conflicts
  app.get('/:code', async (request, reply) => {
    const { code } = request.params;

    // Check Redis cache first
    if (app.redis) {
      const cached = await app.redis.get(`url:${code}`);
      if (cached) {
        const urlData = JSON.parse(cached);
        return reply.redirect(301, urlData.originalUrl);
      }
    }

    // Fallback to MongoDB
    const urlDoc = await app.mongo.db
      .collection('urls')
      .findOne({ shortCode: code });

    if (urlDoc) {
      // Cache for future requests
      if (app.redis) {
        await app.redis.set(
          `url:${code}`,
          JSON.stringify({ originalUrl: urlDoc.originalUrl, clicks: urlDoc.clicks }),
          'EX',
          86400
        );
      }

      return reply.redirect(301, urlDoc.originalUrl);
    }

    // Not found
    return reply.code(404).send({
      error: 'Short URL not found',
      code,
    });
  });

  return app;
}
