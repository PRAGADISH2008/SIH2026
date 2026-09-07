const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const isLocal = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
const isExternalCloud = process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('.render.com') || process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('supabase'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isExternalCloud ? { rejectUnauthorized: false } : undefined,
});

module.exports = pool;
