// Loads the root-level .env (auction-starter/.env) for the backend
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Root .env is two levels up from backend/src
const ROOT_ENV_PATH = path.resolve(__dirname, '../../.env');

dotenv.config({ path: ROOT_ENV_PATH });

// Optional: uncomment to quickly verify
// console.log('[env] DATABASE_URL?', process.env.DATABASE_URL ? 'set' : 'missing');
