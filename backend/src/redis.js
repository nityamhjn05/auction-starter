// backend/src/redis.js
import dotenv from 'dotenv';
import path from 'path';

// Load .env from either backend/.env or project root .env
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback to local .env if present

import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('❌ REDIS_URL is not defined in your .env file. Cannot connect to Redis.');
}

console.log(`[redis] Using URL: ${process.env.REDIS_URL.replace(/:\/\/.*@/, '://****@')}`);

export const redis = new Redis(process.env.REDIS_URL, {
  lazyConnect: false,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
  tls: { rejectUnauthorized: false }, // required for Upstash TLS
});

redis.on('connect', () => console.log('[redis] ✅ connected to Redis'));
redis.on('error', (err) => console.error('[redis] ❌ Redis error:', err.message));

export default redis;
