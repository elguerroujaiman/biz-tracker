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
      // Validate products exist
      for (const item of items) {
        const [rows] = await conn.query(
          `SELECT product_id FROM products WHERE product_id = ?`,
          [item.product_id]
        );
        if (rows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }
      }

      // Calculate total
      let totalAmount = 0;
      items.forEach(item => {
        totalAmount += item.price * item.quantity;
      });

      const [purchaseResult] = await conn.query(
        `INSERT INTO purchases (user_id, total_amount, notes) VALUES (?, ?, ?)`,
        [user_id, totalAmount, notes || null]
      );

      const purchaseId = purchaseResult.insertId;

      for (const item of items) {
        const { product_id, quantity, price } = item;

        await conn.query(
          `INSERT INTO purchase_items (purchase_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
          [purchaseId, product_id, quantity, price]
        );

        await conn.query(
          `UPDATE products SET total_quantity = total_quantity + ? WHERE product_id = ?`,
          [quantity, product_id]
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

// Get all purchases
exports.getPurchases = async (req, res) => {
  const { from, to, product_id, category } = req.query;
  const user_id = req.user.id;

  // Base query to get purchase IDs that match the filter
  let baseFilterQuery = `
    SELECT DISTINCT p.id AS purchase_id
    FROM purchases p
    JOIN purchase_items pi ON p.id = pi.purchase_id
    JOIN products pr ON pi.product_id = pr.product_id
    WHERE p.user_id = ?
  `;

  const filterValues = [user_id];

  if (from) {
    baseFilterQuery += ` AND p.purchase_date >= ?`;
    filterValues.push(from);
  }

  if (to) {
    baseFilterQuery += ` AND p.purchase_date <= ?`;
    filterValues.push(to);
  }

  if (product_id) {
    baseFilterQuery += ` AND pi.product_id = ?`;
    filterValues.push(product_id);
  }

  if (category) {
    baseFilterQuery += ` AND pr.category = ?`;
    filterValues.push(category);
  }

  try {
    const [filteredPurchaseIds] = await db.query(baseFilterQuery, filterValues);

    const purchaseIds = filteredPurchaseIds.map(row => row.purchase_id);

    if (purchaseIds.length === 0) {
      return res.json([]); // No matching purchases
    }

    // Fetch full data for those purchases
    const placeholders = purchaseIds.map(() => '?').join(',');
    const [fullPurchases] = await db.query(
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

    res.json(fullPurchases);
  } catch (err) {
    console.error("Error fetching purchases:", err);
    res.status(500).json({ message: "Error fetching purchases" });
  }
};

// Get a single purchase by ID
exports.getPurchaseById = async (req, res) => {
  const { purchase_id } = req.params;
  const user_id = req.user.id;

  const query = `
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
  `;

  try {
    const [rows] = await db.query(query, [purchase_id, user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Purchase not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching purchase by ID:", err);
    res.status(500).json({ message: "Error fetching purchase" });
  }
};

// Enhanced purchase statistics
exports.getPurchaseStats = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [[totalAmountResult]] = await db.query(
      `SELECT SUM(total_amount) AS total_spent FROM purchases WHERE user_id = ?`,
      [user_id]
    );

    const [[totalPurchasesResult]] = await db.query(
      `SELECT COUNT(*) AS total_purchases FROM purchases WHERE user_id = ?`,
      [user_id]
    );

    const [[totalUnitsResult]] = await db.query(
      `SELECT SUM(quantity) AS total_units_purchased
       FROM purchase_items pi
       JOIN purchases p ON pi.purchase_id = p.id
       WHERE p.user_id = ?`,
      [user_id]
    );

    const [[mostPurchasedProduct]] = await db.query(
      `SELECT pr.name AS product_name, SUM(pi.quantity) AS units_purchased
       FROM purchase_items pi
       JOIN products pr ON pi.product_id = pr.product_id
       JOIN purchases p ON pi.purchase_id = p.id
       WHERE p.user_id = ?
       GROUP BY pi.product_id
       ORDER BY units_purchased DESC
       LIMIT 1`,
      [user_id]
    );

    const [[topSpendingProduct]] = await db.query(
      `SELECT pr.name AS product_name, SUM(pi.quantity * pi.price) AS total_spent
       FROM purchase_items pi
       JOIN products pr ON pi.product_id = pr.product_id
       JOIN purchases p ON pi.purchase_id = p.id
       WHERE p.user_id = ?
       GROUP BY pi.product_id
       ORDER BY total_spent DESC
       LIMIT 1`,
      [user_id]
    );

    const [[highestSinglePurchase]] = await db.query(
      `SELECT MAX(total_amount) AS highest_purchase FROM purchases WHERE user_id = ?`,
      [user_id]
    );

    const totalPurchases = totalPurchasesResult.total_purchases || 0;
    const totalUnits = totalUnitsResult.total_units_purchased || 0;

    res.json({
      total_spent: Number(totalAmountResult.total_spent || 0),
      total_purchases: totalPurchases,
      total_units_purchased: totalUnits,
      most_purchased_product: mostPurchasedProduct?.product_name || null,
      most_purchased_units: mostPurchasedProduct?.units_purchased || 0,
      top_spending_product: topSpendingProduct?.product_name || null,
      top_spending_amount: Number(topSpendingProduct?.total_spent || 0),
      average_order_size: totalPurchases > 0 ? totalUnits / totalPurchases : 0,
      highest_single_purchase: Number(highestSinglePurchase?.highest_purchase || 0),
    });
  } catch (err) {
    console.error("Error fetching purchase stats:", err);
    res.status(500).json({ message: "Error fetching purchase stats" });
  }
};

// Update an existing purchase
exports.updatePurchase = async (req, res) => {
  const { purchase_id } = req.params;
  const { items, notes } = req.body;
  const user_id = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "No purchase items provided" });
  }

  try {
    await withTransaction(async (conn) => {
      // Ensure purchase belongs to user
      const [[purchase]] = await conn.query(
        "SELECT * FROM purchases WHERE id = ? AND user_id = ?",
        [purchase_id, user_id]
      );
      if (!purchase) throw new Error("Purchase not found or unauthorized");

      // Revert product quantities from existing items
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

      // Delete existing items
      await conn.query("DELETE FROM purchase_items WHERE purchase_id = ?", [purchase_id]);

      // Recalculate total and insert new items
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

      // Update purchase record
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