require('dotenv').config();
const pool = require('./pool');

async function updatePhones() {
  try {
    // Drop mobile_number unique constraint if it exists
    const constraints = await pool.query(`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'artisans'::regclass AND contype = 'u'
    `);
    console.log('Unique constraints on artisans:', constraints.rows);

    for (const row of constraints.rows) {
      if (row.conname.includes('mobile')) {
        console.log(`Dropping constraint: ${row.conname}`);
        await pool.query(`ALTER TABLE artisans DROP CONSTRAINT "${row.conname}"`);
      }
    }

    // Update ahilan
    const resAhilan = await pool.query(`
      UPDATE artisans 
      SET mobile_number = '9003518681'
      WHERE display_name = 'ahilan' OR username = 'msreswaran007@gmail.com'
      RETURNING id, username, display_name, mobile_number
    `);
    console.log('Updated ahilan:', resAhilan.rows);

    // Update pragadish
    const resPragadish = await pool.query(`
      UPDATE artisans 
      SET mobile_number = '9500728351'
      WHERE display_name = 'pragadish' OR username = 'praqu123'
      RETURNING id, username, display_name, mobile_number
    `);
    console.log('Updated pragadish:', resPragadish.rows);

    // Also update demo artisan with demo phone if empty
    await pool.query(`
      UPDATE artisans
      SET mobile_number = '9876543210'
      WHERE username = 'artisan' AND (mobile_number IS NULL OR mobile_number = '')
    `);

    const allArtisans = await pool.query('SELECT id, username, display_name, mobile_number FROM artisans');
    console.log('All artisans now:');
    console.table(allArtisans.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error updating phones:', err);
    process.exit(1);
  }
}

updatePhones();
