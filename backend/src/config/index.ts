import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or apps/api
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/marketplace',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_key_12345678901234567890',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_12345678901234567890',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresInDays: 7,
  },
  business: {
    defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata',
    freeCancellationWindowHours: parseInt(process.env.FREE_CANCELLATION_WINDOW_HOURS || '24', 10),
  },
};
