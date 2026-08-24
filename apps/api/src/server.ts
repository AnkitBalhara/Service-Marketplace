import { createApp } from './app';
import { config } from './config';
import { connectToDatabase } from './db';
import { seedDatabase } from './seed';
import { User } from './models';

const startServer = async () => {
  try {
    const uri = await connectToDatabase();

    // Auto-seed if database is empty (e.g. on fresh cold clone startup)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log(`[Database] Fresh database detected. Running initial seed...`);
      await seedDatabase(false); // don't exit process
    }

    const app = createApp();

    app.listen(config.port, () => {
      console.log(`====================================================`);
      console.log(`🚀 MarketPulse API Server is running!`);
      console.log(`📡 URL: http://localhost:${config.port}/api`);
      console.log(`📖 Swagger API Docs: http://localhost:${config.port}/api/docs`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('[Server Error] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
