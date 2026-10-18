"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, before, test } = require("node:test");

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "biztracker-test-"));
process.env.DB_PATH = path.join(tempDirectory, "test.sqlite");
process.env.NODE_ENV = "test";

const db = require("../config/db");
const sales = require("../controllers/salesController");
const purchases = require("../controllers/purchasesController");

let userId;
let otherUserId;
let productId;
let otherProductId;
let saleId;
let purchaseId;

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

async function getValue(sql, params = []) {
  const [[row]] = await db.query(sql, params);
  return row;
}

before(async () => {
  const [firstUser] = await db.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    ["Test Owner", "owner@example.test", "hash"]
  );
  userId = firstUser.insertId;

  const [secondUser] = await db.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    ["Other Owner", "other@example.test", "hash"]
  );
  otherUserId = secondUser.insertId;

  const [firstProduct] = await db.query(
    "INSERT INTO products (user_id, name, unit_price, cost_price, total_quantity) VALUES (?, ?, ?, ?, ?)",
    [userId, "Sample item", 10, 5, 10]
  );
  productId = firstProduct.insertId;

  const [secondProduct] = await db.query(
    "INSERT INTO products (user_id, name, unit_price, cost_price, total_quantity) VALUES (?, ?, ?, ?, ?)",
    [otherUserId, "Private item", 4, 2, 3]
  );
  otherProductId = secondProduct.insertId;
});

after(() => {
  db.close();
  fs.rmSync(tempDirectory, { recursive: true, force: true });
});

test("sale creation records a cost snapshot and decrements stock", async () => {
  const res = responseRecorder();
  await sales.createSale(
    { user: { id: userId }, body: { note: "First sale", items: [{ product_id: productId, quantity: 3, unit_price: 10 }] } },
    res
  );

  assert.equal(res.statusCode, 201);
  saleId = res.body.sale_id;
  assert.equal((await getValue("SELECT total_quantity FROM products WHERE product_id = ?", [productId])).total_quantity, 7);
  assert.equal((await getValue("SELECT cost_price FROM sale_items WHERE sale_id = ?", [saleId])).cost_price, 5);
});

test("sale validation rejects overselling and products owned by another account", async () => {
  const beforeSales = (await getValue("SELECT COUNT(*) AS count FROM sales WHERE user_id = ?", [userId])).count;

  const oversell = responseRecorder();
  await sales.createSale(
    { user: { id: userId }, body: { items: [{ product_id: productId, quantity: 8, unit_price: 10 }] } },
    oversell
  );
  assert.equal(oversell.statusCode, 409);

  const crossAccount = responseRecorder();
  await sales.createSale(
    { user: { id: userId }, body: { items: [{ product_id: otherProductId, quantity: 1, unit_price: 10 }] } },
    crossAccount
  );
  assert.equal(crossAccount.statusCode, 404);
  assert.equal((await getValue("SELECT COUNT(*) AS count FROM sales WHERE user_id = ?", [userId])).count, beforeSales);
  assert.equal((await getValue("SELECT total_quantity FROM products WHERE product_id = ?", [productId])).total_quantity, 7);
});

test("sale edits update inventory atomically and keep the original cost basis", async () => {
  const updated = responseRecorder();
  await sales.updateSale(
    {
      user: { id: userId },
      params: { sale_id: saleId },
      body: { note: "Updated sale", items: [{ product_id: productId, quantity: 2, unit_price: 12 }] },
    },
    updated
  );
  assert.equal(updated.statusCode, 200);
  assert.equal((await getValue("SELECT total_quantity FROM products WHERE product_id = ?", [productId])).total_quantity, 8);
  assert.equal((await getValue("SELECT cost_price FROM sale_items WHERE sale_id = ?", [saleId])).cost_price, 5);

  const failedUpdate = responseRecorder();
  await sales.updateSale(
    {
      user: { id: userId },
      params: { sale_id: saleId },
      body: { items: [{ product_id: productId, quantity: 99, unit_price: 12 }] },
    },
    failedUpdate
  );
  assert.equal(failedUpdate.statusCode, 409);
  assert.equal((await getValue("SELECT total_quantity FROM products WHERE product_id = ?", [productId])).total_quantity, 8);
  assert.equal((await getValue("SELECT quantity FROM sale_items WHERE sale_id = ?", [saleId])).quantity, 2);
});

test("purchase records use the entered cost and refuse stock removal after sales", async () => {
  const created = responseRecorder();
  await purchases.createPurchase(
    {
      user: { id: userId },
      body: { notes: "Restock", items: [{ product_id: productId, quantity: 4, price: 2.75 }] },
    },
    created
  );
  assert.equal(created.statusCode, 201);
  purchaseId = created.body.purchase_id;
  assert.equal((await getValue("SELECT total_quantity FROM products WHERE product_id = ?", [productId])).total_quantity, 12);
  assert.equal((await getValue("SELECT price FROM purchase_items WHERE purchase_id = ?", [purchaseId])).price, 2.75);
  assert.equal((await getValue("SELECT total_amount FROM purchases WHERE id = ?", [purchaseId])).total_amount, 11);
  assert.equal((await getValue("SELECT cost_price FROM products WHERE product_id = ?", [productId])).cost_price, 2.75);

  const editedHistoricalSale = responseRecorder();
  await sales.updateSale(
    {
      user: { id: userId },
      params: { sale_id: saleId },
      body: { items: [{ product_id: productId, quantity: 2, unit_price: 11 }] },
    },
    editedHistoricalSale
  );
  assert.equal(editedHistoricalSale.statusCode, 200);
  assert.equal((await getValue("SELECT cost_price FROM sale_items WHERE sale_id = ?", [saleId])).cost_price, 5);

  const sold = responseRecorder();
  await sales.createSale(
    { user: { id: userId }, body: { items: [{ product_id: productId, quantity: 11, unit_price: 10 }] } },
    sold
  );
  assert.equal(sold.statusCode, 201);
  assert.equal((await getValue("SELECT cost_price FROM sale_items WHERE sale_id = ?", [sold.body.sale_id])).cost_price, 2.75);

  const deletePurchase = responseRecorder();
  await purchases.deletePurchase({ user: { id: userId }, params: { purchase_id: purchaseId } }, deletePurchase);
  assert.equal(deletePurchase.statusCode, 409);
  assert.equal((await getValue("SELECT total_quantity FROM products WHERE product_id = ?", [productId])).total_quantity, 1);
  assert.equal((await getValue("SELECT COUNT(*) AS count FROM purchases WHERE id = ?", [purchaseId])).count, 1);
});

test("deleting a sale restores stock and permits deleting its purchase", async () => {
  const foreignDelete = responseRecorder();
  await sales.deleteSale({ user: { id: otherUserId }, params: { sale_id: saleId } }, foreignDelete);
  assert.equal(foreignDelete.statusCode, 404);

  const sale = await getValue("SELECT sale_id FROM sales WHERE user_id = ? ORDER BY sale_id DESC LIMIT 1", [userId]);
  const deleteSale = responseRecorder();
  await sales.deleteSale({ user: { id: userId }, params: { sale_id: sale.sale_id } }, deleteSale);
  assert.equal(deleteSale.statusCode, 200);

  const deletePurchase = responseRecorder();
  await purchases.deletePurchase({ user: { id: userId }, params: { purchase_id: purchaseId } }, deletePurchase);
  assert.equal(deletePurchase.statusCode, 200);
  assert.equal((await getValue("SELECT total_quantity FROM products WHERE product_id = ?", [productId])).total_quantity, 8);
  assert.equal((await getValue("SELECT cost_price FROM products WHERE product_id = ?", [productId])).cost_price, 5);
});

test("editing a purchase updates the latest product cost and deletion restores it", async () => {
  const created = responseRecorder();
  await purchases.createPurchase(
    {
      user: { id: userId },
      body: { items: [{ product_id: productId, quantity: 2, price: 6 }] },
    },
    created
  );
  const editedPurchaseId = created.body.purchase_id;
  assert.equal((await getValue("SELECT cost_price FROM products WHERE product_id = ?", [productId])).cost_price, 6);

  const updated = responseRecorder();
  await purchases.updatePurchase(
    {
      user: { id: userId },
      params: { purchase_id: editedPurchaseId },
      body: { items: [{ product_id: productId, quantity: 3, price: 7 }] },
    },
    updated
  );
  assert.equal(updated.statusCode, 200);
  assert.equal((await getValue("SELECT cost_price FROM products WHERE product_id = ?", [productId])).cost_price, 7);
  assert.equal((await getValue("SELECT total_quantity FROM products WHERE product_id = ?", [productId])).total_quantity, 11);

  const deleted = responseRecorder();
  await purchases.deletePurchase(
    { user: { id: userId }, params: { purchase_id: editedPurchaseId } },
    deleted
  );
  assert.equal(deleted.statusCode, 200);
  assert.equal((await getValue("SELECT cost_price FROM products WHERE product_id = ?", [productId])).cost_price, 5);
  assert.equal((await getValue("SELECT total_quantity FROM products WHERE product_id = ?", [productId])).total_quantity, 8);
});
