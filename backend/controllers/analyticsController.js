"use strict";

const db = require("../config/db");

/* ------------------------------------------------------------------ *
 * GET /api/analytics/net-revenue?year=YYYY&month=MM                  *
 * ------------------------------------------------------------------ */
exports.getNetRevenue = async (req, res) => {
  const userId = req.user.id;
  const year   = parseInt(req.query.year,  10);
  const month  = parseInt(req.query.month, 10);

  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ message: "year and month are required (1-12)" });
  }

  // SQLite: strftime('%Y', date) returns string, strftime('%m', date) returns 0-padded string
  const sql = `
    SELECT date(s.sale_date)                                   AS day,
           SUM(si.quantity * (si.unit_price - si.cost_price))   AS netRevenue
    FROM   sales      s
    JOIN   sale_items si ON si.sale_id   = s.sale_id
    JOIN   products   p  ON p.product_id = si.product_id
    WHERE  s.user_id = ?
      AND  strftime('%Y', s.sale_date) = ?
      AND  CAST(strftime('%m', s.sale_date) AS INTEGER) = ?
    GROUP  BY day
    ORDER  BY day;
  `;

  try {
    const [rows] = await db.query(sql, [userId, String(year), month]);
    res.json(rows);
  } catch (err) {
    console.error("getNetRevenue error:", err);
    res.status(500).json({ message: "Error fetching net revenue" });
  }
};

/* ------------------------------------------------------------------ *
 * GET /api/analytics/top-net-product                                  *
 * ------------------------------------------------------------------ */
exports.getTopNetProduct = async (req, res) => {
  const userId = req.user.id;
  const from   = req.query.from || "1970-01-01";
  const to     = req.query.to   || "2100-01-01";

  const sql = `
    SELECT  p.product_id,
            p.name,
            SUM(si.quantity)                          AS unitsSold,
            SUM(si.total_price)                       AS totalRevenue,
            SUM(si.quantity * si.cost_price)           AS totalCost,
            SUM(si.total_price) -
            SUM(si.quantity * si.cost_price)           AS netRevenue
    FROM   sale_items si
    JOIN   sales      s  ON si.sale_id   = s.sale_id
    JOIN   products   p  ON si.product_id = p.product_id
    WHERE  s.user_id = ?
      AND  date(s.sale_date) BETWEEN ? AND ?
    GROUP  BY p.product_id
    ORDER  BY netRevenue DESC
    LIMIT 1;
  `;

  try {
    const [[row]] = await db.query(sql, [userId, from, to]);
    res.json(row || {});
  } catch (err) {
    console.error("getTopNetProduct error:", err);
    res.status(500).json({ message: "Error fetching top net-revenue product" });
  }
};

/* ------------------------------------------------------------------ *
 * GET /api/analytics/earnings-per-product                            *
 * ------------------------------------------------------------------ */
exports.getEarningsPerProduct = async (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      p.name,
      SUM((si.unit_price - si.cost_price) * si.quantity) AS earnings
    FROM sale_items si
    JOIN sales    s ON si.sale_id   = s.sale_id
    JOIN products p ON si.product_id = p.product_id
    WHERE s.user_id = ?
    GROUP BY p.product_id
    ORDER BY earnings DESC;
  `;

  try {
    const [rows] = await db.query(sql, [userId]);

    const totalEarnings = rows.reduce((sum, row) => sum + (row.earnings || 0), 0);

    const formatted = rows.map((row) => ({
      name: row.name,
      earnings: row.earnings,
      percentage:
        totalEarnings > 0
          ? parseFloat(((row.earnings / totalEarnings) * 100).toFixed(2))
          : 0,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("getEarningsPerProduct error:", err);
    res.status(500).json({ message: "Error fetching earnings per product" });
  }
};

/* ------------------------------------------------------------------ *
 * GET /api/analytics/product-activity?sort=active|inactive           *
 * ------------------------------------------------------------------ */
exports.getProductActivity = async (req, res) => {
  const userId = req.user.id;
  const sort   = req.query.sort === "active" ? "DESC" : "ASC";

  const sql = `
    SELECT
      p.product_id,
      p.name,
      MAX(s.sale_date) AS lastSold
    FROM products p
    LEFT JOIN sale_items si ON si.product_id = p.product_id
    LEFT JOIN sales      s  ON s.sale_id      = si.sale_id
    WHERE p.user_id = ?
    GROUP BY p.product_id
    ORDER BY lastSold ${sort};
  `;

  try {
    const [rows] = await db.query(sql, [userId]);
    res.json(rows);
  } catch (err) {
    console.error("getProductActivity error:", err);
    res.status(500).json({ message: "Error fetching product activity" });
  }
};

/* ------------------------------------------------------------------ *
 * GET /api/analytics/product-revenue?productId=&year=&month=         *
 * ------------------------------------------------------------------ */
exports.getProductRevenue = async (req, res) => {
  const userId    = req.user.id;
  const productId = parseInt(req.query.productId, 10);
  const year      = parseInt(req.query.year,      10);
  const month     = parseInt(req.query.month,     10);

  if (!productId || !year || !month || month < 1 || month > 12) {
    return res.status(400).json({ message: "productId, year, and month are required" });
  }

  const sql = `
    SELECT date(s.sale_date)                                       AS day,
           SUM((si.unit_price - si.cost_price) * si.quantity)       AS netRevenue
    FROM sale_items si
    JOIN sales    s ON si.sale_id   = s.sale_id
    JOIN products p ON si.product_id = p.product_id
    WHERE s.user_id  = ?
      AND si.product_id = ?
      AND strftime('%Y', s.sale_date) = ?
      AND CAST(strftime('%m', s.sale_date) AS INTEGER) = ?
    GROUP BY day
    ORDER BY day;
  `;

  try {
    const [rows] = await db.query(sql, [userId, productId, String(year), month]);
    res.json(rows);
  } catch (err) {
    console.error("getProductRevenue error:", err);
    res.status(500).json({ message: "Error fetching product revenue" });
  }
};
