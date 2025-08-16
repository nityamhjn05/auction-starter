import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

// --- load ROOT .env (auction-starter/.env) BEFORE anything else ---
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT_ENV   = path.resolve(__dirname, '../../.env');
dotenv.config({ path: ROOT_ENV });

// --- force SSL for pg and bypass CA verification (ok for Supabase dev) ---
pg.defaults.ssl = { require: true, rejectUnauthorized: false };
process.env.PGSSLMODE = process.env.PGSSLMODE || 'no-verify';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

import dayjs from 'dayjs';
import { randomUUID } from 'crypto';
import { sequelize, Auction } from '../src/models/index.js';

try {
  if (!process.env.DATABASE_URL) {
    throw new Error(`DATABASE_URL missing. Expected in ${ROOT_ENV}`);
  }

  await sequelize.authenticate();

  const goLiveAt = dayjs().add(1, 'minute').toDate();
  const endAt    = dayjs(goLiveAt).add(3, 'minute').toDate();

  const a = await Auction.create({
    id: randomUUID(),
    sellerId: 'seller-1',
    itemName: 'Demo Item',
    description: 'First seeded auction',
    startPrice: 100,
    bidIncrement: 10,
    goLiveAt,
    endAt,
    status: 'scheduled',
  });

  console.log('✅ Seeded auction:', a.id, 'goLiveAt:', goLiveAt.toISOString());
  process.exit(0);
} catch (e) {
  console.error('❌ Seed failed:', e);
  process.exit(1);
}
