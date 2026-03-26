import { createClient } from 'redis';

export default async function redisPlugin(fastify, options) {
  try {
    const client = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        connectTimeout: 2000,
        reconnectStrategy: false, // Don't retry
      },
    });

    await Promise.race([
      client.connect(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redis connection timeout')), 2000)
      ),
    ]);

    // Decorate fastify with redis client
    fastify.decorate('redis', {
      get: (key) => client.get(key),
      set: (key, value, flag, ttl) => client.set(key, value, { EX: ttl }),
      del: (key) => client.del(key),
      ping: () => client.ping(),
    });

    fastify.addHook('onClose', async () => {
      await client.quit();
    });

    fastify.log.info('Redis connected successfully');
  } catch (error) {
    fastify.log.warn('Redis not available, running without cache');
    // Decorate with null so guards like `if (fastify.redis)` still work
    fastify.decorate('redis', null);
  }
}
