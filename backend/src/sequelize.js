// backend/src/sequelize.js
import 'dotenv/config';
import { Sequelize } from 'sequelize';
import pg from 'pg';

// Force SSL everywhere (Supabase); safe for local/dev.
pg.defaults.ssl = { require: true, rejectUnauthorized: false };
process.env.PGSSLMODE = 'no-verify';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error('❌ DATABASE_URL not found — expected it in backend/.env (copied from project root)');
}

// Debug once so we know the server sees the same URL as the seed.
if (!process.env._DBURL_LOGGED) {
  console.log('[DB] using URL prefix:', url.slice(0, 60), '...');
  process.env._DBURL_LOGGED = '1';
}

const sequelize = new Sequelize(url, {
  dialect: 'postgres',
  dialectModule: pg, // use the pg instance with ssl defaults
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  pool: { max: 5, idle: 10000, acquire: 60000 },
});

export default sequelize;
