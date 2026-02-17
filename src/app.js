import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

// Plugins
import mongodbPlugin from './plugins/mongodb.js';
import redisPlugin from './plugins/redis.js';

// Routes
import urlRoutes from './routes/urls.js';
import analyticsRoutes from './routes/analytics.js';

export async function build(opts = {}) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    ...opts,
  });

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

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    // Validation errors
    if (error.validation) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    // Rate limit errors
    if (error.statusCode === 429) {
      return reply.code(429).send({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
    }

    // Default error response
    const statusCode = error.statusCode || 500;
    return reply.code(statusCode).send({
      error: error.name || 'Internal Server Error',
      message: error.message || 'An unexpected error occurred',
    });
  });

  // Register Routes
  await app.register(urlRoutes, { prefix: '/api/urls' });
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });

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
        
        // Increment click counter and log click history (async, don't wait)
        app.mongo.db
          .collection('urls')
          .updateOne({ shortCode: code }, { $inc: { clicks: 1 } })
          .catch(err => app.log.error('Failed to increment clicks:', err));
        
        // Log click event
        app.mongo.db
          .collection('clicks')
          .insertOne({
            shortCode: code,
            timestamp: new Date(),
            userAgent: request.headers['user-agent'],
            referer: request.headers['referer'] || null,
            ip: request.ip,
          })
          .catch(err => app.log.error('Failed to log click:', err));
        
        return reply.redirect(301, urlData.originalUrl);
      }
    }

    // Fallback to MongoDB
    const urlDoc = await app.mongo.db
      .collection('urls')
      .findOne({ shortCode: code });

    if (urlDoc) {
      // Increment click counter
      await app.mongo.db
        .collection('urls')
        .updateOne({ shortCode: code }, { $inc: { clicks: 1 } });

      // Log click event
      await app.mongo.db
        .collection('clicks')
        .insertOne({
          shortCode: code,
          timestamp: new Date(),
          userAgent: request.headers['user-agent'],
          referer: request.headers['referer'] || null,
          ip: request.ip,
        });

      // Cache for future requests
      if (app.redis) {
        await app.redis.set(
          `url:${code}`,
          JSON.stringify({ originalUrl: urlDoc.originalUrl, clicks: urlDoc.clicks + 1 }),
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
