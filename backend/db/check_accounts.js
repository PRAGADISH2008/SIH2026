require('dotenv').config();
const pool = require('./pool');

async function checkAccounts() {
  try {
    console.log('==============================================');
    console.log('         ZENCRAFT DATABASE ACCOUNTS           ');
    console.log('==============================================\n');

    // 1. Tables check
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('Tables in database:', tablesRes.rows.map(r => r.table_name).join(', '));
    console.log('\n----------------------------------------------');

    // 2. Artisans Table
    try {
      const artisansRes = await pool.query(`
        SELECT id, username, display_name, mobile_number, region, created_at 
        FROM artisans 
        ORDER BY created_at DESC;
      `);
      console.log(`\n🎨 ARTISANS (${artisansRes.rows.length} total):`);
      if (artisansRes.rows.length === 0) {
        console.log('  (No artisans found in artisans table)');
      } else {
        console.table(artisansRes.rows.map(a => ({
          Username: a.username || '(none)',
          DisplayName: a.display_name || '(none)',
          Mobile: a.mobile_number || '(none)',
          Region: a.region || '(none)',
          Created: a.created_at ? new Date(a.created_at).toLocaleString() : 'N/A'
        })));
      }
    } catch (e) {
      console.log('Note on artisans table:', e.message);
    }

    // 3. Users Table (Buyers / App users)
    try {
      const usersRes = await pool.query(`
        SELECT id, username, display_name, mobile_number, role, created_at 
        FROM users 
        ORDER BY created_at DESC;
      `);
      console.log(`\n👤 USERS / BUYERS (${usersRes.rows.length} total):`);
      if (usersRes.rows.length === 0) {
        console.log('  (No users found in users table)');
      } else {
        console.table(usersRes.rows.map(u => ({
          Username: u.username,
          Role: u.role,
          Name: u.display_name,
          Mobile: u.mobile_number || '(none)',
          Created: u.created_at ? new Date(u.created_at).toLocaleString() : 'N/A'
        })));
      }
    } catch (e) {
      console.log('Note on users table:', e.message);
    }

    // 4. Summary total
    const totalArtisans = (await pool.query("SELECT COUNT(*) FROM artisans")).rows[0].count;
    const totalUsers = (await pool.query("SELECT COUNT(*) FROM users")).rows[0].count;
    console.log('\n----------------------------------------------');
    console.log(`📊 SUMMARY: Total Artisans = ${totalArtisans} | Total Users/Buyers = ${totalUsers}`);
    console.log('==============================================\n');

  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await pool.end();
  }
}

checkAccounts();
