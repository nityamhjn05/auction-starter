import 'dotenv/config';

// Try to load the module and support various export styles
const mod = await import(new URL('../src/sequelize.js', import.meta.url));
// Possible shapes: { default }, { sequelize }, CommonJS default, etc.
const sequelize =
  mod.default?.authenticate ? mod.default :
  mod.sequelize?.authenticate ? mod.sequelize :
  mod.default?.sequelize?.authenticate ? mod.default.sequelize :
  null;

if (!sequelize) {
  console.error('❌ Could not find a Sequelize instance export in ../src/sequelize.js');
  console.error('Module exports were:', Object.keys(mod));
  process.exit(1);
}

try {
  const safe = (process.env.DATABASE_URL || '').replace(/:\/\/.*?:.*?@/, '://***:***@');
  console.log('Connecting to:', safe || '(fallback localhost)');
  await sequelize.authenticate();
  console.log('✅ DB connected');
  process.exit(0);
} catch (e) {
  console.error('❌ DB connection failed:\n', e);
  process.exit(1);
}
