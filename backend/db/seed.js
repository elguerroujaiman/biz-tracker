/**
 * seed.js — Populates the SQLite database with realistic demo data.
 * Run from backend/ with: npm run seed (empty database only)
 * Pass --reset only when you intend to replace all database contents.
 *
 * Creates:
 *  - 1 demo user  (demo@businesstracker.com / Demo1234!)
 *  - 15 products across 4 categories
 *  - 30 purchases spread over the last 3 months
 *  - 60 sales  spread over the last 3 months
 */

"use strict";

const path = require("path");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
require("dotenv").config();
const fs = require("fs");

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, "database.sqlite");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

// ── Helpers ──────────────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().replace("T", " ").substring(0, 19);
}

function randBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Bootstrap DB ─────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Apply schema
const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
db.exec(schema);
const productColumns = db.prepare("PRAGMA table_info(products)").all();
if (!productColumns.some((column) => column.name === "cost_price")) {
  db.exec(`
    ALTER TABLE products ADD COLUMN cost_price REAL NOT NULL DEFAULT 0;
    UPDATE products SET cost_price = unit_price;
  `);
}
const saleItemColumns = db.prepare("PRAGMA table_info(sale_items)").all();
if (!saleItemColumns.some((column) => column.name === "cost_price")) {
  db.exec(`
    ALTER TABLE sale_items ADD COLUMN cost_price REAL NOT NULL DEFAULT 0;
    UPDATE sale_items
       SET cost_price = COALESCE(
         (SELECT cost_price FROM products WHERE products.product_id = sale_items.product_id),
         0
       );
  `);
}
const purchaseItemColumns = db.prepare("PRAGMA table_info(purchase_items)").all();
if (!purchaseItemColumns.some((column) => column.name === "previous_cost_price")) {
  db.exec("ALTER TABLE purchase_items ADD COLUMN previous_cost_price REAL;");
}

const resetRequested = process.argv.includes("--reset");
const existingData = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
if (existingData > 0 && !resetRequested) {
  console.error("This database already contains user data. Pass --reset to replace it with demo data.");
  db.close();
  process.exit(1);
}

if (resetRequested) {
  db.exec(`
    DELETE FROM purchase_items;
    DELETE FROM purchases;
    DELETE FROM sale_items;
    DELETE FROM sales;
    DELETE FROM products;
    DELETE FROM user_settings;
    DELETE FROM users;
  `);
}

console.log("🌱 Seeding database...\n");

// ── 1. User ───────────────────────────────────────────────────────────────────
const passwordHash = bcrypt.hashSync("Demo1234!", 10);
const userId = db
  .prepare(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)"
  )
  .run("Demo User", "demo@businesstracker.com", passwordHash).lastInsertRowid;

db.prepare(
  "INSERT INTO user_settings (user_id, currency_symbol) VALUES (?, ?)"
).run(userId, "$");

console.log(`✅ User created  →  demo@businesstracker.com  /  Demo1234!\n`);

// ── 2. Products ───────────────────────────────────────────────────────────────
const products = [
  // Electronics
  { name: "Wireless Headphones", category: "Electronics", unit_price: 45.00, qty: 80,  threshold: 10 },
  { name: "Bluetooth Speaker",   category: "Electronics", unit_price: 32.50, qty: 55,  threshold: 8  },
  { name: "USB-C Hub",           category: "Electronics", unit_price: 18.00, qty: 120, threshold: 15 },
  { name: "Mechanical Keyboard", category: "Electronics", unit_price: 75.00, qty: 30,  threshold: 5  },
  { name: "Webcam HD 1080p",     category: "Electronics", unit_price: 38.00, qty: 45,  threshold: 7  },
  // Clothing
  { name: "Classic T-Shirt",     category: "Clothing",    unit_price: 8.50,  qty: 200, threshold: 30 },
  { name: "Denim Jacket",        category: "Clothing",    unit_price: 42.00, qty: 60,  threshold: 10 },
  { name: "Running Sneakers",    category: "Clothing",    unit_price: 55.00, qty: 90,  threshold: 12 },
  { name: "Cotton Hoodie",       category: "Clothing",    unit_price: 25.00, qty: 5,   threshold: 15 },
  // Office
  { name: "Ergonomic Chair",     category: "Office",      unit_price: 120.00,qty: 20,  threshold: 3  },
  { name: "Standing Desk",       category: "Office",      unit_price: 180.00,qty: 12,  threshold: 2  },
  { name: "Notebook A5 Pack",    category: "Office",      unit_price: 4.00,  qty: 300, threshold: 50 },
  // Home & Kitchen
  { name: "Coffee Grinder",      category: "Home",        unit_price: 28.00, qty: 40,  threshold: 6  },
  { name: "Stainless Steel Mug", category: "Home",        unit_price: 12.00, qty: 150, threshold: 20 },
  { name: "Air Purifier",        category: "Home",        unit_price: 95.00, qty: 22,  threshold: 4  },
];

const insertProduct = db.prepare(
  `INSERT INTO products (user_id, name, category, unit_price, cost_price, total_quantity, low_stock_threshold, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
);

const productIds = [];
const stockByProduct = new Map();
for (const p of products) {
  const createdAt = daysAgo(randBetween(85, 90));
  const id = insertProduct.run(
    userId, p.name, p.category, p.unit_price, Number((p.unit_price * 0.65).toFixed(2)), p.qty, p.threshold, createdAt, createdAt
  ).lastInsertRowid;
  productIds.push({ id, ...p, cost_price: Number((p.unit_price * 0.65).toFixed(2)) });
  stockByProduct.set(id, p.qty);
}

console.log(`✅ ${products.length} products inserted\n`);

// ── 3. Purchases (restocking events) ─────────────────────────────────────────
const insertPurchase = db.prepare(
  `INSERT INTO purchases (user_id, total_amount, notes, purchase_date) VALUES (?, ?, ?, ?)`
);
const insertPurchaseItem = db.prepare(
  `INSERT INTO purchase_items (purchase_id, product_id, quantity, price, previous_cost_price) VALUES (?, ?, ?, ?, ?)`
);
const updateProductCost = db.prepare("UPDATE products SET cost_price = ? WHERE product_id = ?");

let purchaseCount = 0;
for (let day = 85; day >= 2; day -= randBetween(2, 4)) {
  const numItems = randBetween(1, 3);
  const items = [];
  const usedProducts = new Set();

  for (let i = 0; i < numItems; i++) {
    let prod;
    do { prod = pick(productIds); } while (usedProducts.has(prod.id));
    usedProducts.add(prod.id);
    const qty = randBetween(10, 50);
    items.push({ product_id: prod.id, quantity: qty, price: prod.cost_price });
    stockByProduct.set(prod.id, stockByProduct.get(prod.id) + qty);
  }

  const total = items.reduce((s, it) => s + it.quantity * it.price, 0);
  const purchaseDate = daysAgo(day);
  const purchaseId = insertPurchase.run(userId, total, "Restock order", purchaseDate).lastInsertRowid;

  for (const it of items) {
    const prod = productIds.find((product) => product.id === it.product_id);
    insertPurchaseItem.run(purchaseId, it.product_id, it.quantity, it.price, prod.cost_price);
    updateProductCost.run(it.price, it.product_id);
  }
  purchaseCount++;
}

console.log(`✅ ${purchaseCount} purchases inserted\n`);

// ── 4. Sales ──────────────────────────────────────────────────────────────────
const insertSale = db.prepare(
  `INSERT INTO sales (user_id, total_amount, note, sale_date) VALUES (?, ?, ?, ?)`
);
const insertSaleItem = db.prepare(
  `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price, cost_price)
   VALUES (?, ?, ?, ?, ?, ?)`
);

// Catalog prices are the selling prices; acquisition cost is stored separately.
function sellPrice(prod) {
  return prod.unit_price;
}

let saleCount = 0;
for (let day = 83; day >= 1; day -= randBetween(1, 2)) {
  const numItems = randBetween(1, 4);
  const items = [];
  const usedProducts = new Set();

  for (let i = 0; i < numItems; i++) {
    let prod;
    const availableProducts = productIds.filter(
      (candidate) => !usedProducts.has(candidate.id) && stockByProduct.get(candidate.id) > 0
    );
    if (availableProducts.length === 0) break;
    prod = pick(availableProducts);
    usedProducts.add(prod.id);
    const qty = randBetween(1, Math.min(8, stockByProduct.get(prod.id)));
    const sp  = sellPrice(prod);
    items.push({ product_id: prod.id, quantity: qty, unit_price: sp, total_price: qty * sp });
    stockByProduct.set(prod.id, stockByProduct.get(prod.id) - qty);
  }

  if (items.length === 0) continue;
  const total = items.reduce((s, it) => s + it.total_price, 0);
  const saleDate = daysAgo(day);
  const saleId = insertSale.run(userId, parseFloat(total.toFixed(2)), null, saleDate).lastInsertRowid;

  for (const it of items) {
    insertSaleItem.run(
      saleId,
      it.product_id,
      it.quantity,
      it.unit_price,
      parseFloat(it.total_price.toFixed(2)),
      productIds.find((product) => product.id === it.product_id).cost_price
    );
  }
  saleCount++;
}

const setStock = db.prepare("UPDATE products SET total_quantity = ? WHERE product_id = ?");
for (const [productId, quantity] of stockByProduct) setStock.run(quantity, productId);

console.log(`✅ ${saleCount} sales inserted\n`);

db.close();
console.log("🎉 Database seeded successfully!");
console.log(`   File: ${DB_PATH}`);
console.log(`\n   Demo credentials:`);
console.log(`   Email   : demo@businesstracker.com`);
console.log(`   Password: Demo1234!\n`);
