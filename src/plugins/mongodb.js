import { MongoClient } from 'mongodb';
import fp from 'fastify-plugin';

async function mongodbPlugin(fastify, options) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener';

  const client = new MongoClient(uri);

  try {
    await client.connect();

    const db = client.db('url-shortener');

    // Decorate fastify with mongo object
    fastify.decorate('mongo', { client, db });

    // Create indexes
    await db.collection('urls').createIndex({ shortCode: 1 }, { unique: true });
    await db.collection('urls').createIndex({ createdAt: -1 });
    await db.collection('clicks').createIndex({ shortCode: 1 });
    await db.collection('clicks').createIndex({ timestamp: -1 });

    fastify.log.info('MongoDB connected and indexes created');

    // Close connection when app closes
    fastify.addHook('onClose', async () => {
      await client.close();
    });

  } catch (error) {
    fastify.log.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

export default fp(mongodbPlugin);
