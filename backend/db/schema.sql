-- ============================================================
-- my-business-tracker — SQLite Database Schema
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  username         TEXT    NOT NULL,
  email            TEXT    NOT NULL UNIQUE,
  password         TEXT    NOT NULL,
  created_at       DATETIME DEFAULT (datetime('now'))
);

-- ── User Settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  currency_symbol  TEXT    NOT NULL DEFAULT '$',
  updated_at       DATETIME DEFAULT (datetime('now'))
);

-- ── Products ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  product_id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name               TEXT    NOT NULL,
  category           TEXT,
  unit_price         REAL    NOT NULL DEFAULT 0,
  cost_price         REAL    NOT NULL DEFAULT 0,
  total_quantity     INTEGER NOT NULL DEFAULT 0 CHECK (total_quantity >= 0),
  low_stock_threshold INTEGER NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
  created_at         DATETIME DEFAULT (datetime('now')),
  updated_at         DATETIME DEFAULT (datetime('now'))
);

-- Trigger: auto-update updated_at on product update
CREATE TRIGGER IF NOT EXISTS products_updated_at
  AFTER UPDATE ON products
  FOR EACH ROW
BEGIN
  UPDATE products SET updated_at = datetime('now') WHERE product_id = OLD.product_id;
END;

-- ── Sales ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales (
  sale_id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount REAL    NOT NULL DEFAULT 0,
  note         TEXT,
  sale_date    DATETIME DEFAULT (datetime('now'))
);

-- ── Sale Items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sale_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id     INTEGER NOT NULL REFERENCES sales(sale_id)   ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(product_id),
  quantity    INTEGER NOT NULL,
  unit_price  REAL    NOT NULL,
  total_price REAL    NOT NULL,
  cost_price  REAL    NOT NULL DEFAULT 0
);

-- ── Purchases ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_amount  REAL    NOT NULL DEFAULT 0,
  notes         TEXT,
  purchase_date DATETIME DEFAULT (datetime('now'))
);

-- ── Purchase Items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_items (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id  INTEGER NOT NULL REFERENCES products(product_id),
  quantity    INTEGER NOT NULL,
  price       REAL    NOT NULL,
  previous_cost_price REAL
);

CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_date ON sales(user_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_purchases_user_date ON purchases(user_id, purchase_date);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
