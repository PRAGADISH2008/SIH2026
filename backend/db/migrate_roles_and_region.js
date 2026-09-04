require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { v4: uuidv4 } = require('uuid');
const pool = require('./pool');
const { hashPassword } = require('../utils/password');

async function migrate() {
  console.log('🔄 Running idempotent database migration for roles and artisan regions...');

  // 1. Ensure pgcrypto extension is available if supported
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
  } catch (err) {
    console.log('ℹ️ pgcrypto extension not enabled or not permitted, UUIDs will be generated in Node.js');
  }

  // 2. Add region column to artisans table if it does not exist
  await pool.query(`
    ALTER TABLE artisans
    ADD COLUMN IF NOT EXISTS region VARCHAR(150);
  `);
  console.log('✅ Column artisans.region verified/added.');

  // 3. Update existing artisan regions ONLY when region is NULL or empty
  const regionUpdates = [
    { name: 'ahilan', phone: '9003518681', region: 'Tenkasi, Tamilnadu' },
    { name: 'pragadish', phone: '9500728351', region: 'Krishnagiri, Tamilnadu' },
    { name: 'artisan', phone: '9876543210', region: 'Madurai, Tamilnadu' },
  ];

  for (const item of regionUpdates) {
    const res = await pool.query(
      `UPDATE artisans
       SET region = $1
       WHERE (
         LOWER(username) = LOWER($2)
         OR LOWER(display_name) = LOWER($2)
         OR (mobile_number IS NOT NULL AND mobile_number LIKE '%' || $3)
       )
       AND (region IS NULL OR TRIM(region) = '')`,
      [item.region, item.name, item.phone]
    );
    if (res.rowCount > 0) {
      console.log(`✅ Set region for '${item.name}' (${res.rowCount} row(s)) -> '${item.region}'`);
    } else {
      console.log(`ℹ️ Artisan '${item.name}' already has a region or does not exist (skipped overwrite).`);
    }
  }

  // 4. Create users table for buyers if it does not exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name VARCHAR(100),
      mobile_number VARCHAR(20),
      role VARCHAR(20) DEFAULT 'buyer',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);
  console.log('✅ Users table verified/created.');

  // 5. Seed demo buyer account if not already present
  const demoBuyerUsername = 'buyer';
  const demoBuyerPassword = 'password123';
  const demoBuyerDisplayName = 'Craft Buyer';
  const demoBuyerMobile = '9876543211';

  const existingBuyer = await pool.query(
    'SELECT id, username FROM users WHERE LOWER(username) = $1',
    [demoBuyerUsername]
  );

  if (existingBuyer.rows.length === 0) {
    const buyerId = uuidv4();
    const hashedPassword = await hashPassword(demoBuyerPassword);

    await pool.query(
      `INSERT INTO users (id, username, password_hash, display_name, mobile_number, role)
       VALUES ($1, $2, $3, $4, $5, 'buyer')`,
      [buyerId, demoBuyerUsername, hashedPassword, demoBuyerDisplayName, demoBuyerMobile]
    );
    console.log(`✅ Demo buyer account created: username="${demoBuyerUsername}", password="${demoBuyerPassword}", id=${buyerId}`);
  } else {
    console.log(`ℹ️ Demo buyer account already exists (id=${existingBuyer.rows[0].id}).`);
  }

  console.log('🎉 Migration finished successfully and verified idempotent!');
  await pool.end();
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
