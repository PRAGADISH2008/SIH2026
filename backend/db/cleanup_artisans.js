require('dotenv').config();
const pool = require('./pool');

async function cleanupArtisans() {
  const client = await pool.connect();
  try {
    console.log('--- STARTING ARTISAN CLEANUP ---');
    await client.query('BEGIN');

    // 1. Fetch the two accounts to keep: Master Artisan and Ahilan
    const keepersRes = await client.query(`
      SELECT id, username, display_name 
      FROM artisans 
      WHERE username IN ('artisan', 'ahilan')
    `);

    console.log('Keeper accounts found:', keepersRes.rows);

    const masterArtisan = keepersRes.rows.find(r => r.username === 'artisan');
    const ahilan = keepersRes.rows.find(r => r.username === 'ahilan');

    if (!masterArtisan || !ahilan) {
      throw new Error('Could not locate both Master Artisan and Ahilan in database!');
    }

    const keeperIds = [masterArtisan.id, ahilan.id];

    // 2. Handle products referencing other artisans:
    // Delete orphan empty drafts (product_name IS NULL) from other artisans
    const deleteDraftsRes = await client.query(`
      DELETE FROM products 
      WHERE artisan_id NOT IN ($1, $2) AND product_name IS NULL
    `, keeperIds);
    console.log(`Deleted ${deleteDraftsRes.rowCount} empty draft product(s) linked to other artisans.`);

    // Reassign valid named crafts to Master Artisan so marketplace catalog remains complete
    const reassignRes = await client.query(`
      UPDATE products 
      SET artisan_id = $1 
      WHERE artisan_id NOT IN ($1, $2)
    `, keeperIds);
    console.log(`Reassigned ${reassignRes.rowCount} valid craft product(s) to Master Artisan.`);

    // 3. Delete all other artisan accounts
    const deleteArtisansRes = await client.query(`
      DELETE FROM artisans 
      WHERE id NOT IN ($1, $2)
    `, keeperIds);
    console.log(`Successfully deleted ${deleteArtisansRes.rowCount} artisan accounts.`);

    await client.query('COMMIT');
    console.log('\n--- CLEANUP COMPLETE ---');

    // 4. Verification
    const remaining = await client.query(`
      SELECT id, username, display_name, mobile_number, region, created_at 
      FROM artisans 
      ORDER BY created_at ASC
    `);

    console.log(`\nRemaining Artisan Accounts (${remaining.rows.length} total):`);
    console.table(remaining.rows.map(a => ({
      Username: a.username,
      DisplayName: a.display_name,
      Mobile: a.mobile_number,
      Region: a.region,
      Created: new Date(a.created_at).toLocaleString()
    })));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during artisan cleanup (rolled back):', err);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupArtisans();
