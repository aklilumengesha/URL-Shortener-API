import 'dotenv/config';
import { build } from './src/app.js';

const start = async () => {
  const app = await build({
    logger: true,
  });

  try {
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await app.listen({ port, host });
    
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
