import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || 'https://example.upstash.io',
  token: process.env.UPSTASH_REDIS_TOKEN || 'dev-token'
});
export default redis;
