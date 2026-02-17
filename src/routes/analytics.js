export default async function analyticsRoutes(fastify, options) {
  // GET /analytics - Get overall system analytics
  fastify.get('/', {
    handler: async (request, reply) => {
      // Total URLs created
      const totalUrls = await fastify.mongo.db
        .collection('urls')
        .countDocuments({});

      // Total clicks across all URLs
      const totalClicks = await fastify.mongo.db
        .collection('clicks')
        .countDocuments({});

      // Average clicks per URL
      const avgClicksPerUrl = totalUrls > 0 ? (totalClicks / totalUrls).toFixed(2) : 0;

      // Most recent URLs
      const recentUrls = await fastify.mongo.db
        .collection('urls')
        .find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

      return reply.send({
        totalUrls,
        totalClicks,
        avgClicksPerUrl: parseFloat(avgClicksPerUrl),
        recentUrls: recentUrls.map(url => ({
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          clicks: url.clicks,
          createdAt: url.createdAt.toISOString(),
        })),
      });
    },
  });

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

      // Aggregate browser/device data from user agents
      const browserStats = await fastify.mongo.db
        .collection('clicks')
        .aggregate([
          { $match: { shortCode: code } },
          {
            $group: {
              _id: '$userAgent',
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray();

      // Aggregate clicks by date (last 7 days)
      const clicksByDate = await fastify.mongo.db
        .collection('clicks')
        .aggregate([
          { $match: { shortCode: code, timestamp: { $gte: last7d } } },
          {
            $group: {
              _id: {
                $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ])
        .toArray();

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
        topBrowsers: browserStats.map(stat => ({
          userAgent: stat._id,
          count: stat.count,
        })),
        clicksByDate: clicksByDate.map(stat => ({
          date: stat._id,
          count: stat.count,
        })),
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
