-- Artisan Catalogue App — Database Schema

-- Artisans table
CREATE TABLE IF NOT EXISTS artisans (
  id UUID PRIMARY KEY,
  username VARCHAR(100) UNIQUE,
  password_hash TEXT,
  display_name VARCHAR(100),
  mobile_number VARCHAR(20) UNIQUE,
  region VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (Buyers) table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name VARCHAR(100),
  mobile_number VARCHAR(20),
  role VARCHAR(20) DEFAULT 'buyer',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OTPs table (for auth flow)
CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  mobile_number VARCHAR(20) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table (matches api-contract.json schema)
CREATE TABLE IF NOT EXISTS products (
  product_id UUID PRIMARY KEY,
  artisan_id UUID NOT NULL REFERENCES artisans(id),
  product_name VARCHAR(255),
  category VARCHAR(100),
  craft_type VARCHAR(100),
  material VARCHAR(255),
  description TEXT,
  language_original VARCHAR(50),
  keywords TEXT[],
  images_original_url TEXT,
  images_enhanced_url TEXT,
  production_time_days INTEGER,
  production_technique VARCHAR(255),
  pricing_estimated_cost NUMERIC(10, 2),
  pricing_market_range_low NUMERIC(10, 2),
  pricing_market_range_high NUMERIC(10, 2),
  pricing_recommended_price NUMERIC(10, 2),
  pricing_confidence NUMERIC(3, 2),
  pricing_reasoning TEXT[],
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_artisan_id ON products(artisan_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_craft_type ON products(craft_type);
CREATE INDEX IF NOT EXISTS idx_otps_mobile_number ON otps(mobile_number);
