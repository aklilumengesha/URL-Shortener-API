import fastifyMongodb from '@fastify/mongodb';

export default async function mongodbPlugin(fastify, options) {
  await fastify.register(fastifyMongodb, {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener',
  });

  // Create indexes after connection
  fastify.addHook('onReady', async () => {
    const db = fastify.mongo.db;
    
    // Create unique index on shortCode
    await db.collection('urls').createIndex({ shortCode: 1 }, { unique: true });
    
    // Create index on createdAt for sorting
    await db.collection('urls').createIndex({ createdAt: -1 });

    fastify.log.info('MongoDB indexes created successfully');
  });
}
