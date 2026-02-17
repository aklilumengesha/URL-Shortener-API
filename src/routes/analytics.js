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

      // Calculate statistics
      const now = new Date();
      const last24h = new Date(now - 24 * 60 * 60 * 1000);
      const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

      const clicksLast24h = await fastify.mongo.db
        .collection('clicks')
        .countDocuments({ shortCode: code, timestamp: { $gte: last24h } });

      const clicksLast7d = await fastify.mongo.db
        .collection('clicks')
        .countDocuments({ shortCode: code, timestamp: { $gte: last7d } });

      const clicksLast30d = await fastify.mongo.db
        .collection('clicks')
        .countDocuments({ shortCode: code, timestamp: { $gte: last30d } });

      return reply.send({
        shortCode: code,
        originalUrl: urlDoc.originalUrl,
        createdAt: urlDoc.createdAt.toISOString(),
        totalClicks,
        statistics: {
          last24h: clicksLast24h,
          last7d: clicksLast7d,
          last30d: clicksLast30d,
        },
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
