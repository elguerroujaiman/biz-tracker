const db = require("../config/db");
const withTransaction = require("../utils/transaction");

// Create a new purchase
exports.createPurchase = async (req, res) => {
  const { items, notes } = req.body;
  const user_id = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No purchase items provided" });
  }

  try {
    const purchaseId = await withTransaction(async (conn) => {
      for (const item of items) {
        const [rows] = await conn.query(
          "SELECT product_id FROM products WHERE product_id = ?",
          [item.product_id]
        );
        if (rows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }
      }

      let totalAmount = 0;
      items.forEach(item => {
        totalAmount += item.price * item.quantity;
      });

      const [purchaseResult] = await conn.query(
        "INSERT INTO purchases (user_id, total_amount, notes) VALUES (?, ?, ?)",
        [user_id, totalAmount, notes || null]
      );

      const purchaseId = purchaseResult.insertId;

      for (const item of items) {
        await conn.query(
          "INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
          [purchaseId, item.product_id, item.quantity, item.price]
        );

        await conn.query(
          "UPDATE products SET total_quantity = total_quantity + ? WHERE product_id = ?",
          [item.quantity, item.product_id]
        );
      }

      return purchaseId;
    });

    res.status(201).json({ message: "Purchase recorded successfully", purchase_id: purchaseId });
  } catch (err) {
    console.error("Error creating purchase:", err);
    res.status(400).json({ message: err.message || "Error creating purchase" });
  }
};

// Get all purchases with filters
exports.getPurchases = async (req, res) => {
  const { from, to, product_id, category } = req.query;
  const user_id = req.user.id;

  let filterQuery = `
    SELECT DISTINCT p.id AS purchase_id
    FROM purchases p
    JOIN purchase_items pi ON p.id = pi.purchase_id
    JOIN products pr ON pi.product_id = pr.product_id
    WHERE p.user_id = ?
  `;
  const params = [user_id];

  if (from) {
    filterQuery += " AND p.purchase_date >= ?";
    params.push(from);
  }

  if (to) {
    filterQuery += " AND p.purchase_date <= ?";
    params.push(to);
  }

  if (product_id) {
    filterQuery += " AND pi.product_id = ?";
    params.push(product_id);
  }

  if (category) {
    filterQuery += " AND pr.category = ?";
    params.push(category);
  }

  try {
    const [filteredIds] = await db.query(filterQuery, params);
    const purchaseIds = filteredIds.map(row => row.purchase_id);

    if (purchaseIds.length === 0) {
      return res.json([]);
    }

    const placeholders = purchaseIds.map(() => '?').join(',');
    const [purchasesData] = await db.query(
      `
      SELECT 
        p.id AS purchase_id,
        p.purchase_date,
        p.total_amount,
        p.notes,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', pi.product_id,
            'product_name', pr.name,
            'category', pr.category,
            'quantity', pi.quantity,
            'unit_price', pi.price,
            'total_price', pi.price * pi.quantity
          )
        ) AS items
      FROM purchases p
      JOIN purchase_items pi ON p.id = pi.purchase_id
      JOIN products pr ON pi.product_id = pr.product_id
      WHERE p.user_id = ? AND p.id IN (${placeholders})
      GROUP BY p.id
      ORDER BY p.purchase_date DESC
      `,
      [user_id, ...purchaseIds]
    );

    const purchases = purchasesData.map(p => ({
      ...p,
      items: typeof p.items === "string" ? JSON.parse(p.items) : p.items
    }));

    res.json(purchases);
  } catch (err) {
    console.error("Error fetching purchases:", err);
    res.status(500).json({ message: "Error fetching purchases" });
  }
};

// Get a single purchase
exports.getPurchaseById = async (req, res) => {
  const { purchase_id } = req.params;
  const user_id = req.user.id;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        p.id AS purchase_id,
        p.purchase_date,
        p.total_amount,
        p.notes,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'product_id', pi.product_id,
            'product_name', pr.name,
            'category', pr.category,
            'quantity', pi.quantity,
            'unit_price', pi.price,
            'total_price', pi.price * pi.quantity
          )
        ) AS items
      FROM purchases p
      JOIN purchase_items pi ON p.id = pi.purchase_id
      JOIN products pr ON pi.product_id = pr.product_id
      WHERE p.id = ? AND p.user_id = ?
      GROUP BY p.id
      `,
      [purchase_id, user_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    const purchase = rows[0];

    // Fix: Only parse if it's a string
    purchase.items = typeof purchase.items === "string"
      ? JSON.parse(purchase.items)
      : purchase.items;

    res.json(purchase);
  } catch (err) {
    console.error("Error fetching purchase:", err);
    res.status(500).json({ message: "Error fetching purchase" });
  }
};

// Get stats
exports.getPurchaseStats = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [[totalAmount]] = await db.query(
      "SELECT SUM(total_amount) AS total_spent FROM purchases WHERE user_id = ?",
      [user_id]
    );

    const [[totalPurchases]] = await db.query(
      "SELECT COUNT(*) AS total_purchases FROM purchases WHERE user_id = ?",
      [user_id]
    );

    const [[totalUnits]] = await db.query(
      `
      SELECT SUM(quantity) AS total_units_purchased
      FROM purchase_items pi
      JOIN purchases p ON pi.purchase_id = p.id
      WHERE p.user_id = ?
      `,
      [user_id]
    );

    const [[mostPurchased]] = await db.query(
      `
      SELECT pr.name AS product_name, SUM(pi.quantity) AS units_purchased
      FROM purchase_items pi
      JOIN products pr ON pi.product_id = pr.product_id
      JOIN purchases p ON pi.purchase_id = p.id
      WHERE p.user_id = ?
      GROUP BY pi.product_id
      ORDER BY units_purchased DESC
      LIMIT 1
      `,
      [user_id]
    );

    const [[topSpending]] = await db.query(
      `
      SELECT pr.name AS product_name, SUM(pi.quantity * pi.price) AS total_spent
      FROM purchase_items pi
      JOIN products pr ON pi.product_id = pr.product_id
      JOIN purchases p ON pi.purchase_id = p.id
      WHERE p.user_id = ?
      GROUP BY pi.product_id
      ORDER BY total_spent DESC
      LIMIT 1
      `,
      [user_id]
    );

    const [[highestPurchase]] = await db.query(
      "SELECT MAX(total_amount) AS highest_purchase FROM purchases WHERE user_id = ?",
      [user_id]
    );

    const total = totalPurchases.total_purchases || 0;
    const units = totalUnits.total_units_purchased || 0;

    res.json({
      total_spent: Number(totalAmount.total_spent || 0),
      total_purchases: total,
      total_units_purchased: units,
      most_purchased_product: mostPurchased?.product_name || null,
      most_purchased_units: mostPurchased?.units_purchased || 0,
      top_spending_product: topSpending?.product_name || null,
      top_spending_amount: Number(topSpending?.total_spent || 0),
      average_order_size: total > 0 ? units / total : 0,
      highest_single_purchase: Number(highestPurchase?.highest_purchase || 0),
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Error fetching purchase stats" });
  }
};

// Update purchase
exports.updatePurchase = async (req, res) => {
  const { purchase_id } = req.params;
  const { items, notes } = req.body;
  const user_id = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No purchase items provided" });
  }

  try {
    await withTransaction(async (conn) => {
      const [[purchase]] = await conn.query(
        "SELECT * FROM purchases WHERE id = ? AND user_id = ?",
        [purchase_id, user_id]
      );
      if (!purchase) throw new Error("Purchase not found or unauthorized");

      const [existingItems] = await conn.query(
        "SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?",
        [purchase_id]
      );

      for (const item of existingItems) {
        await conn.query(
          "UPDATE products SET total_quantity = total_quantity - ? WHERE product_id = ?",
          [item.quantity, item.product_id]
        );
      }

      await conn.query("DELETE FROM purchase_items WHERE purchase_id = ?", [purchase_id]);

      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.price * item.quantity;

        await conn.query(
          "INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
          [purchase_id, item.product_id, item.quantity, item.price]
        );

        await conn.query(
          "UPDATE products SET total_quantity = total_quantity + ? WHERE product_id = ?",
          [item.quantity, item.product_id]
        );
      }

      await conn.query(
        "UPDATE purchases SET total_amount = ?, notes = ? WHERE id = ?",
        [totalAmount, notes || null, purchase_id]
      );
    });

    res.json({ message: "Purchase updated successfully" });
  } catch (err) {
    console.error("Error updating purchase:", err);
    res.status(400).json({ message: err.message || "Error updating purchase" });
  }
};

//Delete a purchase 
exports.deletePurchase = async (req, res) => {
  const { purchase_id } = req.params;
  const user_id = req.user.id; // Assumes auth middleware sets req.user

  try {
    await withTransaction(async (conn) => {
      // Check that the purchase exists and belongs to the user
      const [[purchase]] = await conn.query(
        "SELECT * FROM purchases WHERE id = ? AND user_id = ?",
        [purchase_id, user_id]
      );

      if (!purchase) {
        return res.status(404).json({ message: "Purchase not found or unauthorized" });
      }

      // Get purchased items
      const [items] = await conn.query(
        "SELECT product_id, quantity FROM purchase_items WHERE purchase_id = ?",
        [purchase_id]
      );

      // Decrease stock levels
      for (const { product_id, quantity } of items) {
        await conn.query(
          "UPDATE products SET total_quantity = total_quantity - ? WHERE product_id = ?",
          [quantity, product_id]
        );
      }

      // Delete purchase items
      await conn.query(
        "DELETE FROM purchase_items WHERE purchase_id = ?",
        [purchase_id]
      );

      // Delete the purchase itself
      await conn.query(
        "DELETE FROM purchases WHERE id = ?",
        [purchase_id]
      );
    });

    res.json({ message: "Purchase deleted successfully" });
  } catch (err) {
    console.error("Error deleting purchase:", err);
    res.status(500).json({ message: "Error deleting purchase" });
  }
};

exports.getPurchaseSummary = async (req, res) => {
  const user_id = req.user.id;

  try {
    // Lifetime totals
    const [[totals]] = await db.query(
      `SELECT
          COALESCE(SUM(total_amount),0) AS totalSpent,
          COUNT(*)                      AS totalPurchases
       FROM purchases
       WHERE user_id = ?`,
      [user_id]
    );

    // Today’s KPIs
    const [[today]] = await db.query(
      `SELECT
          COALESCE(SUM(total_amount),0) AS todaysSpent,
          COUNT(*)                      AS todaysPurchases
       FROM purchases
       WHERE user_id = ?
         AND DATE(purchase_date) = CURDATE()`,
      [user_id]
    );

    res.json({
      totalSpent: Number(totals.totalSpent),
      totalPurchases: totals.totalPurchases,
      todaysSpent: Number(today.todaysSpent),
      todaysPurchases: today.todaysPurchases,
    });
  } catch (err) {
    console.error("Error in getPurchaseSummary:", err);
    res.status(500).json({ message: "Error fetching purchase summary" });
  }
};

exports.getDailyPurchases = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT
          DATE(purchase_date)      AS date,
          SUM(total_amount)        AS total
       FROM purchases
       WHERE user_id = ?
         AND purchase_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(purchase_date)
       ORDER BY DATE(purchase_date) ASC`,
      [user_id]
    );

    res.json(rows);          // [{ "date":"2025-06-03", "total": 123.45 }, …]
  } catch (err) {
    console.error("Error in getDailyPurchases:", err);
    res.status(500).json({ message: "Error fetching daily purchases" });
  }
};