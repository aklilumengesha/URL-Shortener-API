import fastifyRedis from '@fastify/redis';

export default async function redisPlugin(fastify, options) {
  await fastify.register(fastifyRedis, {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  });

  fastify.addHook('onReady', async () => {
    try {
      await fastify.redis.ping();
      fastify.log.info('Redis connection established successfully');
    } catch (error) {
      fastify.log.warn('Redis connection failed, continuing without cache');
    }
  });
}
