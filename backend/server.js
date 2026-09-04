require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Ensure uploads directory exists ────────────────────────────────────────
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
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
app.listen(PORT, () => {
  console.log(`🚀 Artisan Catalogue API running on http://localhost:${PORT}`);
  console.log(`📋 Base URL: http://localhost:${PORT}/api/v1`);
});
