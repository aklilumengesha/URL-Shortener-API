import { nanoid } from 'nanoid';
import { createUrlSchema } from '../schemas/url.schema.js';

export default async function urlRoutes(fastify, options) {
  // GET /api/urls - List all URLs with pagination
  fastify.get('/', {
    handler: async (request, reply) => {
      const { page = 1, limit = 10 } = request.query;
      const skip = (page - 1) * limit;

      const urls = await fastify.mongo.db
        .collection('urls')
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray();

      const total = await fastify.mongo.db
        .collection('urls')
        .countDocuments({});

      return reply.send({
        urls: urls.map(url => ({
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          clicks: url.clicks,
          createdAt: url.createdAt.toISOString(),
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    },
  });

  // POST /api/urls - Create shortened URL
  fastify.post('/', {
    schema: createUrlSchema,
    handler: async (request, reply) => {
      const { url, customAlias } = request.body;

      // Validate URL format
      try {
        const urlObj = new URL(url);
        
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          return reply.code(400).send({
            error: 'Invalid URL protocol. Only HTTP and HTTPS are allowed.',
          });
        }
      } catch (error) {
        return reply.code(400).send({
          error: 'Invalid URL format.',
        });
      }

      // Validate custom alias if provided
      let shortCode;
      if (customAlias) {
        // Check if alias matches pattern (already validated by schema)
        // Check for reserved words
        const reservedWords = ['api', 'health', 'admin', 'analytics'];
        if (reservedWords.includes(customAlias.toLowerCase())) {
          return reply.code(400).send({
            error: 'This alias is reserved and cannot be used.',
          });
        }
        
        // Check if custom alias already exists
        const existingAlias = await fastify.mongo.db
          .collection('urls')
          .findOne({ shortCode: customAlias });
        
        if (existingAlias) {
          return reply.code(409).send({
            error: 'This alias is already taken. Please choose another.',
          });
        }
        
        shortCode = customAlias;
      } else {
        // Generate short code using nanoid
        shortCode = nanoid(7);
      }

      // Save to MongoDB
      const urlDocument = {
        shortCode,
        originalUrl: url,
        createdAt: new Date(),
        clicks: 0,
      };

      await fastify.mongo.db.collection('urls').insertOne(urlDocument);

      // Cache in Redis for fast lookups
      if (fastify.redis) {
        await fastify.redis.set(
          `url:${shortCode}`,
          JSON.stringify({ originalUrl: url, clicks: 0 }),
          'EX',
          86400 // 24 hours TTL
        );
      }

      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      
      return reply.code(201).send({
        shortCode,
        shortUrl: `${baseUrl}/${shortCode}`,
        originalUrl: url,
        createdAt: new Date().toISOString(),
      });
    },
  });

  // GET /api/urls/:code - Get URL details by short code
  fastify.get('/:code', {
    handler: async (request, reply) => {
      const { code } = request.params;

      // Check Redis cache first
      if (fastify.redis) {
        const cached = await fastify.redis.get(`url:${code}`);
        if (cached) {
          const urlData = JSON.parse(cached);
          return reply.send({
            shortCode: code,
            originalUrl: urlData.originalUrl,
            clicks: urlData.clicks,
            source: 'cache',
          });
        }
      }

      // Fallback to MongoDB if not in cache
      const urlDoc = await fastify.mongo.db
        .collection('urls')
        .findOne({ shortCode: code });

      if (urlDoc) {
        // Cache the result for future requests
        if (fastify.redis) {
          await fastify.redis.set(
            `url:${code}`,
            JSON.stringify({ originalUrl: urlDoc.originalUrl, clicks: urlDoc.clicks }),
            'EX',
            86400
          );
        }

        return reply.send({
          shortCode: urlDoc.shortCode,
          originalUrl: urlDoc.originalUrl,
          clicks: urlDoc.clicks,
          createdAt: urlDoc.createdAt.toISOString(),
          source: 'database',
        });
      }

      // URL not found
      return reply.code(404).send({
        error: 'Short URL not found',
        code,
      });
    },
  });
}
