import { nanoid } from 'nanoid';
import { createUrlSchema } from '../schemas/url.schema.js';

export default async function urlRoutes(fastify, options) {
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

      // Generate short code using nanoid
      const shortCode = nanoid(7);

      // TODO: Save to database
      // TODO: Cache in Redis

      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      
      return reply.code(201).send({
        shortCode,
        shortUrl: `${baseUrl}/${shortCode}`,
        originalUrl: url,
        createdAt: new Date().toISOString(),
      });
    },
  });
}
