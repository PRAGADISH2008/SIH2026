require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const pool = require('./pool');
const { hashPassword } = require('../utils/password');

async function migrate() {
  console.log('🔄 Running safe database migration for artisans table...');

  // 1. Add new columns safely
  await pool.query(`
    ALTER TABLE artisans ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;
    ALTER TABLE artisans ADD COLUMN IF NOT EXISTS password_hash TEXT;
    ALTER TABLE artisans ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
    ALTER TABLE artisans ALTER COLUMN mobile_number DROP NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_artisans_username ON artisans(username);
  `);
  console.log('✅ Columns added or verified.');

  // 2. Seed development/SIH demo artisan account
  const demoUsername = 'artisan';
  const demoPassword = 'password123';
  const demoDisplayName = 'Master Artisan';

  const existing = await pool.query(
    'SELECT id, username FROM artisans WHERE username = $1',
    [demoUsername]
  );

  const hashedPassword = await hashPassword(demoPassword);

  if (existing.rows.length === 0) {
    const demoId = uuidv4();
    await pool.query(
      `INSERT INTO artisans (id, username, password_hash, display_name)
       VALUES ($1, $2, $3, $4)`,
      [demoId, demoUsername, hashedPassword, demoDisplayName]
    );
    console.log(`✅ Demo artisan created: username="${demoUsername}", id=${demoId}`);
  } else {
    await pool.query(
      `UPDATE artisans
       SET password_hash = $1, display_name = $2
       WHERE username = $3`,
      [hashedPassword, demoDisplayName, demoUsername]
    );
    console.log(`✅ Demo artisan updated with fresh secure password hash: username="${demoUsername}"`);
  }

  console.log('🎉 Migration completed successfully!');
  await pool.end();
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
