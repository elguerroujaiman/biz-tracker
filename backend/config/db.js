"use strict";

const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, "../db/database.sqlite");
const SCHEMA_PATH = path.join(__dirname, "../db/schema.sql");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000");
sqlite.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));

const productColumns = sqlite.prepare("PRAGMA table_info(products)").all();
if (!productColumns.some((column) => column.name === "cost_price")) {
  sqlite.exec(`
    ALTER TABLE products ADD COLUMN cost_price REAL NOT NULL DEFAULT 0;
    UPDATE products SET cost_price = unit_price;
  `);
}

// Preserve the best available cost estimate for older databases. New sales
// keep this value on each line so later catalog edits do not rewrite history.
const saleItemColumns = sqlite.prepare("PRAGMA table_info(sale_items)").all();
if (!saleItemColumns.some((column) => column.name === "cost_price")) {
  sqlite.exec(`
    ALTER TABLE sale_items ADD COLUMN cost_price REAL NOT NULL DEFAULT 0;
    UPDATE sale_items
       SET cost_price = COALESCE((
         SELECT cost_price FROM products WHERE products.product_id = sale_items.product_id
       ), 0);
  `);
}

const purchaseItemColumns = sqlite.prepare("PRAGMA table_info(purchase_items)").all();
if (!purchaseItemColumns.some((column) => column.name === "previous_cost_price")) {
  sqlite.exec("ALTER TABLE purchase_items ADD COLUMN previous_cost_price REAL;");
}

function translateSQL(sql) {
  return sql
    .replace(/\bCURDATE\(\)/gi, "date('now')")
    .replace(/\bNOW\(\)/gi, "datetime('now')")
    .replace(/DATE_SUB\(([^,]+),\s*INTERVAL\s+(\d+)\s+DAY\)/gi, (_, column, days) =>
      `date(${column.trim()}, '-${days} days')`
    )
    .replace(/\bDATE\(([^)]+)\)/gi, (_, column) => `date(${column})`)
    .replace(/\bYEAR\(([^)]+)\)/gi, (_, column) => `strftime('%Y', ${column})`)
    .replace(/\bMONTH\(([^)]+)\)/gi, (_, column) => `strftime('%m', ${column})`)
    .replace(/\bJSON_ARRAYAGG\s*\(/gi, "json_group_array(")
    .replace(/\bJSON_OBJECT\s*\(/gi, "json_object(");
}

function execute(sql, params = []) {
  const translated = translateSQL(sql);
  const values = (params || []).map((value) => (value === undefined ? null : value));
  const statement = sqlite.prepare(translated);
  const command = translated.trimStart().toUpperCase();

  if (command.startsWith("SELECT") || command.startsWith("WITH") || command.startsWith("PRAGMA")) {
    return [statement.all(values), []];
  }

  const result = statement.run(values);
  return [
    {
      affectedRows: result.changes,
      insertId: result.lastInsertRowid,
      changedRows: result.changes,
    },
    [],
  ];
}

const adapter = {
  query(sql, params = []) {
    try {
      return Promise.resolve(execute(sql, params));
    } catch (error) {
      return Promise.reject(error);
    }
  },

  // Transaction callbacks must stay synchronous so every read and write runs
  // inside better-sqlite3's native transaction and rolls back together.
  transaction(callback) {
    const run = sqlite.transaction(() => {
      const connection = { query: execute };
      const result = callback(connection);
      if (result && typeof result.then === "function") {
        throw new TypeError("SQLite transaction callbacks must be synchronous");
      }
      return result;
    });
    return run();
  },

  close() {
    if (sqlite.open) sqlite.close();
  },
};

module.exports = adapter;
