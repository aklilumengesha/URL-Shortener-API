import { nanoid } from 'nanoid';
import { createUrlSchema } from '../schemas/url.schema.js';

export default async function urlRoutes(fastify, options) {
  // POST /api/urls - Create shortened URL
  fastify.post('/', {
    schema: createUrlSchema,
    handler: async (request, reply) => {
      const { url, customAlias } = request.body;

      // TODO: Add validation logic
      // TODO: Generate short code
      // TODO: Save to database
      // TODO: Cache in Redis

      return reply.code(201).send({
        shortCode: 'temp123',
        shortUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/temp123`,
        originalUrl: url,
        createdAt: new Date().toISOString(),
      });
    },
  });
}
