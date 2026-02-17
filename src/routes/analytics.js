export default async function analyticsRoutes(fastify, options) {
  // GET /analytics/:code - Get analytics for a specific short URL
  fastify.get('/:code', {
    handler: async (request, reply) => {
      const { code } = request.params;

      // Get URL document
      const urlDoc = await fastify.mongo.db
        .collection('urls')
        .findOne({ shortCode: code });

      if (!urlDoc) {
        return reply.code(404).send({
          error: 'Short URL not found',
          code,
        });
      }

      // Get total clicks from URL document
      const totalClicks = urlDoc.clicks || 0;

      // Get click history
      const clickHistory = await fastify.mongo.db
        .collection('clicks')
        .find({ shortCode: code })
        .sort({ timestamp: -1 })
        .limit(100)
        .toArray();

      return reply.send({
        shortCode: code,
        originalUrl: urlDoc.originalUrl,
        createdAt: urlDoc.createdAt.toISOString(),
        totalClicks,
        recentClicks: clickHistory.map(click => ({
          timestamp: click.timestamp.toISOString(),
          userAgent: click.userAgent,
          referer: click.referer,
          ip: click.ip,
        })),
      });
    },
  });
}
