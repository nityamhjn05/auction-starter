// backend/scripts/sync.mjs
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Load ROOT .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Enforce SSL bypass for local dev with Supabase
pg.defaults.ssl = { require: true, rejectUnauthorized: false };
process.env.PGSSLMODE = process.env.PGSSLMODE || 'no-verify';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';

import { sequelize } from '../src/models/index.js';

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
  console.log('✅ Tables synced in Supabase');
  process.exit(0);
} catch (e) {
  console.error('❌ Sync failed:', e);
  process.exit(1);
}
