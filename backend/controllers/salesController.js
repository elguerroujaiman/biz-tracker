const db = require("../config/db");
const withTransaction = require("../utils/transaction");

exports.createSale = async (req, res) => {
  const { items, note } = req.body;
  const user_id = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No sale items provided" });
  }

  try {
    const result = await withTransaction(async (conn) => {
      for (const item of items) {
        const [rows] = await conn.query(
          `SELECT total_quantity FROM products WHERE product_id = ?`,
          [item.product_id]
        );
        if (rows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }
        if (rows[0].total_quantity < item.quantity) {
          throw new Error(`Not enough stock for product ID ${item.product_id}`);
        }
      }

      let totalAmount = 0;
      items.forEach(item => {
        totalAmount += item.unit_price * item.quantity;
      });

      const [saleResult] = await conn.query(
        `INSERT INTO sales (user_id, total_amount, note)
         VALUES (?, ?, ?)`,
        [user_id, totalAmount, note || null]
      );

      const saleId = saleResult.insertId;

      for (const item of items) {
        const { product_id, quantity, unit_price } = item;

        await conn.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?)`,
          [saleId, product_id, quantity, unit_price, quantity * unit_price]
        );

        await conn.query(
          `UPDATE products SET total_quantity = total_quantity - ? WHERE product_id = ?`,
          [quantity, product_id]
        );
      }

      return saleId;
    });

    res.status(201).json({ message: "Sale recorded successfully", sale_id: result });
  } catch (err) {
    console.error("Error creating sale:", err);
    res.status(400).json({ message: err.message || "Error creating sale" });
  }
};

exports.getSales = async (req, res) => {
  const { from, to, product_id, category } = req.query;
  const user_id = req.user.id;

  let query = `
    SELECT 
      s.sale_id, 
      s.sale_date, 
      s.total_amount, 
      s.note,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'product_id', si.product_id,
          'product_name', p.name,
          'category', p.category,
          'quantity', si.quantity,
          'unit_price', si.unit_price,
          'total_price', si.total_price
        )
      ) AS items
    FROM sales s
    JOIN sale_items si ON s.sale_id = si.sale_id
    JOIN products p ON si.product_id = p.product_id
    WHERE s.user_id = ?
  `;

  const values = [user_id];

  if (from) {
    query += ` AND s.sale_date >= ?`;
    values.push(from);
  }

  if (to) {
    query += ` AND s.sale_date <= ?`;
    values.push(to);
  }

  if (product_id) {
    query += ` AND si.product_id = ?`;
    values.push(product_id);
  }

  if (category) {
    query += ` AND p.category = ?`;
    values.push(category);
  }

  query += `
    GROUP BY s.sale_id
    ORDER BY s.sale_date DESC
  `;

  try {
    const [rows] = await db.query(query, values);
    res.json(rows);
  } catch (err) {
    console.error("Error fetching sales:", err);
    res.status(500).json({ message: "Error fetching sales" });
  }
};

exports.getSaleById = async (req, res) => {
  const { sale_id } = req.params;
  const user_id = req.user.id;

  let query = `
    SELECT 
      s.sale_id, 
      s.sale_date, 
      s.total_amount, 
      s.note,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'product_id', si.product_id,
          'product_name', p.name,
          'category', p.category,
          'quantity', si.quantity,
          'unit_price', si.unit_price,
          'total_price', si.total_price
        )
      ) AS items
    FROM sales s
    JOIN sale_items si ON s.sale_id = si.sale_id
    JOIN products p ON si.product_id = p.product_id
    WHERE s.sale_id = ? AND s.user_id = ?
    GROUP BY s.sale_id
  `;

  try {
    const [rows] = await db.query(query, [sale_id, user_id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching sale by ID:", err);
    res.status(500).json({ message: "Error fetching sale" });
  }
};

exports.getSalesStats = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [[totalRevenueResult]] = await db.query(
      `SELECT SUM(total_amount) AS total_revenue FROM sales WHERE user_id = ?`,
      [user_id]
    );

    const [[totalSalesResult]] = await db.query(
      `SELECT COUNT(*) AS total_sales FROM sales WHERE user_id = ?`,
      [user_id]
    );

    const [[totalUnitsResult]] = await db.query(
      `SELECT SUM(quantity) AS total_units_sold
       FROM sale_items si
       JOIN sales s ON si.sale_id = s.sale_id
       WHERE s.user_id = ?`,
      [user_id]
    );

    const [[bestSellingProduct]] = await db.query(
      `SELECT p.name AS product_name, SUM(si.quantity) AS units_sold
       FROM sale_items si
       JOIN products p ON si.product_id = p.product_id
       JOIN sales s ON si.sale_id = s.sale_id
       WHERE s.user_id = ?
       GROUP BY si.product_id
       ORDER BY units_sold DESC
       LIMIT 1`,
      [user_id]
    );

    const [[topRevenueProduct]] = await db.query(
      `SELECT p.name AS product_name, SUM(si.total_price) AS revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.product_id
       JOIN sales s ON si.sale_id = s.sale_id
       WHERE s.user_id = ?
       GROUP BY si.product_id
       ORDER BY revenue DESC
       LIMIT 1`,
      [user_id]
    );

    const [[highestSingleSale]] = await db.query(
      `SELECT MAX(total_amount) AS highest_sale
       FROM sales
       WHERE user_id = ?`,
      [user_id]
    );

    // New additions
    const [topProducts] = await db.query(
      `SELECT p.name AS product_name, SUM(si.quantity) AS total_units
       FROM sale_items si
       JOIN products p ON si.product_id = p.product_id
       JOIN sales s ON si.sale_id = s.sale_id
       WHERE s.user_id = ?
       GROUP BY p.name
       ORDER BY total_units DESC
       LIMIT 5`,
      [user_id]
    );

    const [revenueByProduct] = await db.query(
      `SELECT p.name AS product_name, SUM(si.total_price) AS revenue
       FROM sale_items si
       JOIN products p ON si.product_id = p.product_id
       JOIN sales s ON si.sale_id = s.sale_id
       WHERE s.user_id = ?
       GROUP BY p.name
       ORDER BY revenue DESC
       LIMIT 5`,
      [user_id]
    );

    const totalSales = totalSalesResult.total_sales || 0;
    const totalUnits = totalUnitsResult.total_units_sold || 0;

    res.json({
      total_sales: totalSales,
      total_revenue: Number(totalRevenueResult.total_revenue || 0),
      best_selling_product: bestSellingProduct?.product_name || null,
      best_selling_units: bestSellingProduct?.units_sold || 0,
      top_revenue_product: topRevenueProduct?.product_name || null,
      top_revenue_amount: Number(topRevenueProduct?.revenue || 0),
      total_units_sold: totalUnits,
      average_order_size: totalSales > 0 ? totalUnits / totalSales : 0,
      highest_single_sale: Number(highestSingleSale?.highest_sale || 0),
      top_products: topProducts || [],
      revenue_by_product: revenueByProduct || [],
    });
  } catch (err) {
    console.error("Error fetching sales stats:", err);
    res.status(500).json({ message: "Error fetching sales stats" });
  }
};

exports.updateSale = async (req, res) => {
  const { sale_id } = req.params;
  const { note, items } = req.body;
  const user_id = req.user.id;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "Sale items are required." });
  }

  try {
    await withTransaction(async (conn) => {
      // 1. Verify sale exists and belongs to the user
      const [existingSale] = await conn.query(
        "SELECT sale_id FROM sales WHERE sale_id = ? AND user_id = ?",
        [sale_id, user_id]
      );
      if (existingSale.length === 0) {
        throw new Error("Sale not found or not authorized.");
      }

      // 2. Restore stock from old items
      const [oldItems] = await conn.query(
        "SELECT product_id, quantity FROM sale_items WHERE sale_id = ?",
        [sale_id]
      );
      for (const item of oldItems) {
        await conn.query(
          "UPDATE products SET total_quantity = total_quantity + ? WHERE product_id = ?",
          [item.quantity, item.product_id]
        );
      }

      // 3. Delete old sale_items
      await conn.query("DELETE FROM sale_items WHERE sale_id = ?", [sale_id]);

      // 4. Insert new sale_items & deduct stock
      let totalAmount = 0;
      for (const item of items) {
        const { product_id, quantity, unit_price } = item;
        const total_price = quantity * unit_price;
        totalAmount += total_price;

        await conn.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?)`,
          [sale_id, product_id, quantity, unit_price, total_price]
        );

        await conn.query(
          "UPDATE products SET total_quantity = total_quantity - ? WHERE product_id = ?",
          [quantity, product_id]
        );
      }

      // 5. Update note and total_amount
      await conn.query(
        "UPDATE sales SET note = ?, total_amount = ? WHERE sale_id = ?",
        [note || null, totalAmount, sale_id]
      );
    });

    res.json({ message: "Sale updated successfully" });
  } catch (err) {
    console.error("Error updating sale:", err);
    res.status(500).json({ message: err.message || "Error updating sale" });
  }
};

exports.deleteSale = async (req, res) => {
  const { sale_id } = req.params;
  const user_id = req.user.id;

  try {
    await withTransaction(async (conn) => {
      // 1. Get sale items to restore product stock
      const [items] = await conn.query(
        "SELECT product_id, quantity FROM sale_items WHERE sale_id = ?",
        [sale_id]
      );

      // 2. Restore stock for each product
      for (const item of items) {
        await conn.query(
          "UPDATE products SET total_quantity = total_quantity + ? WHERE product_id = ?",
          [item.quantity, item.product_id]
        );
      }

      // 3. Delete sale items
      await conn.query("DELETE FROM sale_items WHERE sale_id = ?", [sale_id]);

      // 4. Delete the sale itself
      const [result] = await conn.query(
        "DELETE FROM sales WHERE sale_id = ? AND user_id = ?",
        [sale_id, user_id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Sale not found or not authorized");
      }
    });

    res.json({ message: "Sale deleted successfully" });
  } catch (err) {
    console.error("Error deleting sale:", err);
    res.status(500).json({ message: err.message || "Error deleting sale" });
  }
};

exports.getSalesSummary = async (req, res) => {
  const user_id = req.user.id;

  try {
    // Total lifetime revenue & count
    const [[totals]] = await db.query(
      `SELECT
          COALESCE(SUM(total_amount),0)     AS totalRevenue,
          COUNT(*)                          AS totalSales
       FROM sales
       WHERE user_id = ?`,
      [user_id]
    );

    // Today’s KPIs
    const [[today]] = await db.query(
      `SELECT
          COALESCE(SUM(total_amount),0)     AS todaysRevenue,
          COUNT(*)                          AS todaysSales
       FROM sales
       WHERE user_id = ?
         AND DATE(sale_date) = CURDATE()`,
      [user_id]
    );

    res.json({
      totalRevenue: Number(totals.totalRevenue),
      totalSales: totals.totalSales,
      todaysRevenue: Number(today.todaysRevenue),
      todaysSales: today.todaysSales,
    });
  } catch (err) {
    console.error("Error in getSalesSummary:", err);
    res.status(500).json({ message: "Error fetching sales summary" });
  }
};

exports.getDailySales = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT
          DATE(sale_date)           AS date,
          SUM(total_amount)         AS total
       FROM sales
       WHERE user_id = ?
         AND sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(sale_date)
       ORDER BY DATE(sale_date) ASC`,
      [user_id]
    );

    res.json(rows);            // [{ date:"2025-06-07", total: 123.45 }, …]
  } catch (err) {
    console.error("Error in getDailySales:", err);
    res.status(500).json({ message: "Error fetching daily sales" });
  }
};