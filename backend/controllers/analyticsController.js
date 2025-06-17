const db = require("../config/db");

/* ------------------------------------------------------------------ *
 * Helpers                                                            *
 * ------------------------------------------------------------------ */
const TZ_NAME   = "Africa/Casablanca";
const TZ_OFFSET = "+01:00";      // fallback when zone tables absent

/** Convert a timestamp column from UTC to Morocco local time. */
function toLocal(col) {
  return `IFNULL(
            CONVERT_TZ(${col}, '+00:00', '${TZ_NAME}'),
            CONVERT_TZ(${col}, '+00:00', '${TZ_OFFSET}')
          )`;
}

/* ------------------------------------------------------------------ *
 *  GET /api/analytics/net-revenue?year=YYYY&month=MM                 *
 * ------------------------------------------------------------------ */
exports.getNetRevenue = async (req, res) => {
  const userId = req.user.id;
  const year   = parseInt(req.query.year, 10);
  const month  = parseInt(req.query.month, 10);

  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ message: "year and month are required (1-12)" });
  }

  const localDate = `DATE(s.sale_date)`; // NO timezone conversion

  const sql = `
    SELECT ${localDate}                          AS day,
           SUM(si.quantity * (si.unit_price
                             - p.unit_price))    AS netRevenue
    FROM   sales        s
    JOIN   sale_items   si  ON si.sale_id   = s.sale_id
    JOIN   products     p   ON p.product_id = si.product_id
    WHERE  s.user_id = ?
      AND  YEAR(${localDate})  = ?
      AND  MONTH(${localDate}) = ?
    GROUP  BY day
    ORDER  BY day;
  `;

  try {
    const [rows] = await db.query(sql, [userId, year, month]);
    res.json(rows);  // e.g. [{ day:"2025-06-08", netRevenue: 99.5 }]
  } catch (err) {
    console.error("getNetRevenue error:", err);
    res.status(500).json({ message: "Error fetching net revenue" });
  }
};

/* ------------------------------------------------------------------ *
 *  GET /api/analytics/top-net-product  (unchanged)                    *
 * ------------------------------------------------------------------ */
exports.getTopNetProduct = async (req, res) => {

  const userId = req.user.id;
  const from   = req.query.from || "1970-01-01";
  const to     = req.query.to   || "2100-01-01";

  const localDate = `DATE(${toLocal("s.sale_date")})`;

  const sql = `
    SELECT  p.product_id,
            p.name,
            SUM(si.quantity)                     AS unitsSold,
            SUM(si.total_price)                  AS totalRevenue,
            SUM(si.quantity * p.unit_price)      AS totalCost,
            SUM(si.total_price) -
            SUM(si.quantity * p.unit_price)      AS netRevenue
    FROM   sale_items si
    JOIN   sales      s  ON si.sale_id   = s.sale_id
    JOIN   products   p  ON si.product_id = p.product_id
    WHERE  s.user_id = ?
      AND  ${localDate} BETWEEN ? AND ?
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
 *  GET /api/analytics/earnings-per-product                           *
 * ------------------------------------------------------------------ */
exports.getEarningsPerProduct = async (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT 
      p.name,
      SUM((si.unit_price - p.unit_price) * si.quantity) AS earnings
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.sale_id
    JOIN products p ON si.product_id = p.product_id
    WHERE s.user_id = ?
    GROUP BY p.product_id
    ORDER BY earnings DESC;
  `;

  try {
    const [rows] = await db.query(sql, [userId]);

    const totalEarnings = rows.reduce((sum, row) => sum + (row.earnings || 0), 0);

    const formatted = rows.map(row => ({
      name: row.name,
      earnings: row.earnings,
      percentage: totalEarnings > 0 ? parseFloat(((row.earnings / totalEarnings) * 100).toFixed(2)) : 0
    }));

    res.json(formatted);
  } catch (err) {
    console.error("getEarningsPerProduct error:", err);
    res.status(500).json({ message: "Error fetching earnings per product" });
  }
};

/* ------------------------------------------------------------------ *
 *  GET /api/analytics/product-activity?sort=active|inactive          *
 * ------------------------------------------------------------------ */
exports.getProductActivity = async (req, res) => {
  const userId = req.user.id;
  const sort = req.query.sort === "active" ? "DESC" : "ASC";

  const sql = `
    SELECT 
      p.product_id,
      p.name,
      MAX(${toLocal("s.sale_date")}) AS lastSold
    FROM products p
    LEFT JOIN sale_items si ON si.product_id = p.product_id
    LEFT JOIN sales s ON s.sale_id = si.sale_id
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