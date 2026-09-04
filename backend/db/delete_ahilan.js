require('dotenv').config();
const pool = require('./pool');

async function deleteAhilan() {
  const client = await pool.connect();
  try {
    console.log('--- DELETING AHILAN ACCOUNT FROM ARTISANS ---');
    await client.query('BEGIN');

    // 1. Locate ahilan
    const ahilanRes = await client.query("SELECT id, username, display_name FROM artisans WHERE username = 'ahilan'");
    if (ahilanRes.rows.length === 0) {
      console.log('No artisan account found with username "ahilan".');
      await client.query('ROLLBACK');
      return;
    }
    const ahilanId = ahilanRes.rows[0].id;

    // 2. Locate master artisan
    const masterRes = await client.query("SELECT id FROM artisans WHERE username = 'artisan'");
    const masterId = masterRes.rows.length > 0 ? masterRes.rows[0].id : null;

    // 3. Handle products linked to ahilan
    // Delete unnamed drafts belonging to ahilan
    const deleteDrafts = await client.query(
      "DELETE FROM products WHERE artisan_id = $1 AND product_name IS NULL",
      [ahilanId]
    );
    console.log(`Deleted ${deleteDrafts.rowCount} draft product(s) belonging to ahilan.`);

    // Reassign any remaining valid crafts to Master Artisan so marketplace doesn't lose items or violate foreign key
    if (masterId) {
      const reassign = await client.query(
        "UPDATE products SET artisan_id = $1 WHERE artisan_id = $2",
        [masterId, ahilanId]
      );
      console.log(`Reassigned ${reassign.rowCount} craft(s) from ahilan to Master Artisan.`);
    } else {
      await client.query("DELETE FROM products WHERE artisan_id = $1", [ahilanId]);
    }

    // 4. Delete ahilan from artisans table
    const deleteAhilanRes = await client.query("DELETE FROM artisans WHERE id = $1", [ahilanId]);
    console.log(`Deleted ${deleteAhilanRes.rowCount} artisan row for ahilan.`);

    await client.query('COMMIT');
    console.log('Transaction committed successfully!\n');

    // 5. Verification
    const remaining = await client.query("SELECT id, username, display_name, mobile_number, region, created_at FROM artisans");
    console.log(`Remaining Artisan Accounts (${remaining.rows.length} total):`);
    console.table(remaining.rows.map(a => ({
      Username: a.username,
      DisplayName: a.display_name,
      Mobile: a.mobile_number,
      Region: a.region,
      Created: new Date(a.created_at).toLocaleString()
    })));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting ahilan (rolled back):', err);
  } finally {
    client.release();
    await pool.end();
  }
}

deleteAhilan();
