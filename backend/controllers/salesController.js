const db = require("../config/db");
const withTransaction = require("../utils/transaction");

function requestError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeSaleItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    throw new Error("Add between 1 and 100 sale items.");
  }

  return items.map((item) => {
    const product_id = Number(item?.product_id);
    const quantity = Number(item?.quantity);
    const unit_price = Number(item?.unit_price);
    if (!Number.isSafeInteger(product_id) || product_id < 1) throw new Error("Choose a valid product.");
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000) {
      throw new Error("Quantity must be a positive whole number.");
    }
    if (!Number.isFinite(unit_price) || unit_price < 0 || unit_price > 1000000000) {
      throw new Error("Enter a valid unit price.");
    }
    return { product_id, quantity, unit_price: Math.round(unit_price * 100) / 100 };
  });
}

function addQuantities(items) {
  return items.reduce((quantities, item) => {
    quantities.set(item.product_id, (quantities.get(item.product_id) || 0) + item.quantity);
    return quantities;
  }, new Map());
}

function cleanNote(note) {
  if (note == null || note === "") return null;
  if (typeof note !== "string" || note.length > 500) throw new Error("Note must be 500 characters or fewer.");
  return note.trim() || null;
}

exports.createSale = async (req, res) => {
  let items;
  let saleNote;
  const user_id = req.user.id;

  try {
    items = normalizeSaleItems(req.body.items);
    saleNote = cleanNote(req.body.note);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  try {
    const result = await withTransaction((conn) => {
      const quantities = addQuantities(items);
      for (const [productId, quantity] of quantities) {
        const [rows] = conn.query(
          "SELECT product_id, name, total_quantity FROM products WHERE product_id = ? AND user_id = ?",
          [productId, user_id]
        );
        if (rows.length === 0) throw requestError(`Product ${productId} was not found in your catalog.`, 404);
        if (rows[0].total_quantity < quantity) throw requestError(`Not enough stock for ${rows[0].name}.`, 409);
      }

      const totalAmount = Math.round(items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) * 100) / 100;

      const [saleResult] = conn.query(
        `INSERT INTO sales (user_id, total_amount, note)
         VALUES (?, ?, ?)`,
        [user_id, totalAmount, saleNote]
      );

      const saleId = saleResult.insertId;

      for (const item of items) {
        const { product_id, quantity, unit_price } = item;
        const [[product]] = conn.query(
          "SELECT cost_price FROM products WHERE product_id = ? AND user_id = ?",
          [product_id, user_id]
        );

        conn.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price, cost_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [saleId, product_id, quantity, unit_price, quantity * unit_price, product.cost_price]
        );
      }

      for (const [productId, quantity] of quantities) {
        const [update] = conn.query(
          `UPDATE products SET total_quantity = total_quantity - ?
           WHERE product_id = ? AND user_id = ? AND total_quantity >= ?`,
          [quantity, productId, user_id, quantity]
        );
        if (update.affectedRows !== 1) throw requestError("Stock changed while recording this sale. Please try again.", 409);
      }

      return saleId;
    });

    res.status(201).json({ message: "Sale recorded successfully", sale_id: result });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("Error creating sale:", err);
    res.status(status).json({ message: status < 500 ? err.message : "Error creating sale" });
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
      ) AS items,
      SUM((si.unit_price - si.cost_price) * si.quantity) AS total_earnings
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

    // Parse `items` field if needed (sometimes MySQL returns it as string)
    const parsedRows = rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items
    }));

    res.json(parsedRows);
  } catch (err) {
    console.error("Error fetching sales:", err);
    res.status(500).json({ message: "Error fetching sales" });
  }
};

exports.getSaleById = async (req, res) => {
  const { sale_id } = req.params;
  const user_id = req.user.id;

  const query = `
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
          'total_price', si.total_price,
          'cost_price', si.cost_price,
          'earnings', (si.unit_price - si.cost_price) * si.quantity
        )
      ) AS items,
      SUM((si.unit_price - si.cost_price) * si.quantity) AS total_earnings
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

    // MySQL returns `items` as a string, so parse it once here
    const sale = rows[0];
    if (typeof sale.items === "string") {
      sale.items = JSON.parse(sale.items);
    }

    res.json(sale);
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
  const user_id = req.user.id;
  let items;
  let saleNote;

  try {
    items = normalizeSaleItems(req.body.items);
    saleNote = cleanNote(req.body.note);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  try {
    withTransaction((conn) => {
      const [existingSale] = conn.query(
        "SELECT sale_id FROM sales WHERE sale_id = ? AND user_id = ?",
        [sale_id, user_id]
      );
      if (existingSale.length === 0) throw requestError("Sale not found.", 404);

      const [oldItems] = conn.query(
        "SELECT product_id, quantity, cost_price FROM sale_items WHERE sale_id = ?",
        [sale_id]
      );
      const previousCosts = new Map(oldItems.map((item) => [item.product_id, item.cost_price]));
      for (const item of oldItems) {
        conn.query(
          "UPDATE products SET total_quantity = total_quantity + ? WHERE product_id = ? AND user_id = ?",
          [item.quantity, item.product_id, user_id]
        );
      }

      const quantities = addQuantities(items);
      const costs = new Map();
      for (const [productId, quantity] of quantities) {
        const [[product]] = conn.query(
          "SELECT name, cost_price, total_quantity FROM products WHERE product_id = ? AND user_id = ?",
          [productId, user_id]
        );
        if (!product) throw requestError(`Product ${productId} was not found in your catalog.`, 404);
        const available = product.total_quantity;
        if (available < quantity) throw requestError(`Not enough stock for ${product.name}.`, 409);
        costs.set(productId, previousCosts.get(productId) ?? product.cost_price);
      }

      conn.query("DELETE FROM sale_items WHERE sale_id = ?", [sale_id]);

      for (const { product_id, quantity, unit_price } of items) {
        conn.query(
          `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price, cost_price)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [sale_id, product_id, quantity, unit_price, quantity * unit_price, costs.get(product_id)]
        );
      }

      for (const [productId, quantity] of quantities) {
        const [update] = conn.query(
          `UPDATE products SET total_quantity = total_quantity - ?
           WHERE product_id = ? AND user_id = ? AND total_quantity >= ?`,
          [quantity, productId, user_id, quantity]
        );
        if (update.affectedRows !== 1) throw requestError("Stock changed while updating this sale. Please try again.", 409);
      }

      const totalAmount = Math.round(items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) * 100) / 100;
      conn.query(
        "UPDATE sales SET note = ?, total_amount = ? WHERE sale_id = ?",
        [saleNote, totalAmount, sale_id]
      );
    });

    res.json({ message: "Sale updated successfully" });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("Error updating sale:", err);
    res.status(status).json({ message: status < 500 ? err.message : "Error updating sale" });
  }
};

exports.deleteSale = async (req, res) => {
  const { sale_id } = req.params;
  const user_id = req.user.id;

  try {
    withTransaction((conn) => {
      const [sale] = conn.query(
        "SELECT sale_id FROM sales WHERE sale_id = ? AND user_id = ?",
        [sale_id, user_id]
      );
      if (!sale.length) throw requestError("Sale not found.", 404);

      const [items] = conn.query(
        "SELECT product_id, quantity FROM sale_items WHERE sale_id = ?",
        [sale_id]
      );

      for (const item of items) {
        conn.query(
          "UPDATE products SET total_quantity = total_quantity + ? WHERE product_id = ? AND user_id = ?",
          [item.quantity, item.product_id, user_id]
        );
      }

      const [result] = conn.query(
        "DELETE FROM sales WHERE sale_id = ? AND user_id = ?",
        [sale_id, user_id]
      );

      if (result.affectedRows === 0) {
        throw requestError("Sale not found.", 404);
      }
    });

    res.json({ message: "Sale deleted successfully" });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("Error deleting sale:", err);
    res.status(status).json({ message: status < 500 ? err.message : "Error deleting sale" });
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
         AND date(sale_date) = date('now')`,
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
         AND date(sale_date) >= date('now', '-30 days')
       GROUP BY date(sale_date)
       ORDER BY date(sale_date) ASC`,
      [user_id]
    );

    res.json(rows);            // [{ date:"2025-06-07", total: 123.45 }, …]
  } catch (err) {
    console.error("Error in getDailySales:", err);
    res.status(500).json({ message: "Error fetching daily sales" });
  }
};

exports.getTopProducts = async (req, res) => {
  const user  = req.user.id;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const [rows] = await db.query(
      `
      SELECT p.product_id,
             p.name,
             p.total_quantity AS stock,
             SUM(si.quantity) AS unitsSold,
             SUM(si.total_price) AS salesAmount
      FROM sale_items si
      JOIN sales s    ON si.sale_id = s.sale_id
      JOIN products p ON si.product_id = p.product_id
      WHERE s.user_id = ?
      GROUP BY p.product_id
      ORDER BY unitsSold DESC
      LIMIT ?
      `,
      [user, limit]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error fetching top products" });
  }
};
