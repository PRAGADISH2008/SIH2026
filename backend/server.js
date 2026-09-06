require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const pool = require('./db/pool');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Ensure uploads directory exists ────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Automatic Database Table Initialization ────────────────────────────────
async function initDb() {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ DATABASE_URL not configured. Skipping table creation.');
    return;
  }
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('✅ PostgreSQL database tables and indexes verified/initialized successfully');
    }
  } catch (err) {
    console.error('⚠️ Database auto-initialization notice:', err.message);
  }
}

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);

// ─── Health check ───────────────────────────────────────────────────────────
const handleHealth = (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
};
app.get('/health', handleHealth);
app.get('/api/v1/health', handleHealth);

// ─── 404 fallback ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    code: 404,
  });
});

// ─── Start server ───────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 Artisan Catalogue API running on http://localhost:${PORT}`);
  console.log(`📋 Base URL: http://localhost:${PORT}/api/v1`);
  await initDb();
});
