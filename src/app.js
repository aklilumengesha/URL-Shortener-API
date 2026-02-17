import Fastify from 'fastify';

export async function build(opts = {}) {
  const app = Fastify(opts);

  // Routes will be registered here later

  return app;
}
