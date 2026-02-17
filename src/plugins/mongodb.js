import fastifyMongodb from '@fastify/mongodb';

export default async function mongodbPlugin(fastify, options) {
  await fastify.register(fastifyMongodb, {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener',
  });
}
