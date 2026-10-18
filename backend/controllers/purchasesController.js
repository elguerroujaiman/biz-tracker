const db = require("../config/db");
const withTransaction = require("../utils/transaction");

function requestError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizePurchaseItems(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    throw new Error("Add between 1 and 100 purchase items.");
  }

  return items.map((item) => {
    const product_id = Number(item?.product_id);
    const quantity = Number(item?.quantity);
    const price = Number(item?.price ?? item?.unit_price);
    if (!Number.isSafeInteger(product_id) || product_id < 1) throw new Error("Choose a valid product.");
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000) {
      throw new Error("Quantity must be a positive whole number.");
    }
    if (!Number.isFinite(price) || price < 0 || price > 1000000000) {
      throw new Error("Enter a valid unit purchase price.");
    }
    return { product_id, quantity, price: Math.round(price * 100) / 100 };
  });
}

function cleanNotes(notes) {
  if (notes == null || notes === "") return null;
  if (typeof notes !== "string" || notes.length > 500) throw new Error("Notes must be 500 characters or fewer.");
  return notes.trim() || null;
}

function hasLaterPurchaseForProduct(conn, purchase, userId, productId) {
  const [rows] = conn.query(
    `SELECT 1
       FROM purchase_items pi
       JOIN purchases p ON p.id = pi.purchase_id
      WHERE p.user_id = ? AND pi.product_id = ? AND p.id <> ?
        AND (p.purchase_date > ? OR (p.purchase_date = ? AND p.id > ?))
      LIMIT 1`,
    [userId, productId, purchase.id, purchase.purchase_date, purchase.purchase_date, purchase.id]
  );
  return rows.length > 0;
}

function getCostBeforePurchase(conn, purchase, userId, productId) {
  const [[previous]] = conn.query(
    `SELECT pi.price
       FROM purchase_items pi
       JOIN purchases p ON p.id = pi.purchase_id
      WHERE p.user_id = ? AND pi.product_id = ? AND p.id <> ?
        AND (p.purchase_date < ? OR (p.purchase_date = ? AND p.id < ?))
      ORDER BY p.purchase_date DESC, p.id DESC, pi.id DESC
      LIMIT 1`,
    [userId, productId, purchase.id, purchase.purchase_date, purchase.purchase_date, purchase.id]
  );
  return previous?.price ?? null;
}

function restoreLatestCosts(conn, purchase, userId, oldItems) {
  const lastItemByProduct = new Map();
  for (const item of oldItems) {
    const current = lastItemByProduct.get(item.product_id);
    if (!current || item.id > current.id) lastItemByProduct.set(item.product_id, item);
  }

  for (const [productId, lastItem] of lastItemByProduct) {
    if (hasLaterPurchaseForProduct(conn, purchase, userId, productId)) continue;

    const [[product]] = conn.query(
      "SELECT cost_price FROM products WHERE product_id = ? AND user_id = ?",
      [productId, userId]
    );
    if (!product || Math.abs(Number(product.cost_price) - Number(lastItem.price)) > 0.0001) continue;

    const restoredCost = lastItem.previous_cost_price ?? getCostBeforePurchase(conn, purchase, userId, productId);
    if (restoredCost != null) {
      conn.query(
        "UPDATE products SET cost_price = ? WHERE product_id = ? AND user_id = ?",
        [restoredCost, productId, userId]
      );
    }
  }
}

// Create a new purchase
exports.createPurchase = async (req, res) => {
  const user_id = req.user.id;
  let items;
  let purchaseNotes;

  try {
    items = normalizePurchaseItems(req.body.items);
    purchaseNotes = cleanNotes(req.body.notes);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  try {
    const purchaseId = withTransaction((conn) => {
      for (const item of items) {
        const [rows] = conn.query(
          "SELECT product_id, cost_price FROM products WHERE product_id = ? AND user_id = ?",
          [item.product_id, user_id]
        );

        if (rows.length === 0) {
          throw requestError(`Product ${item.product_id} was not found in your catalog.`, 404);
        }
      }

      const totalAmount = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
      const [purchaseResult] = conn.query(
        "INSERT INTO purchases (user_id, total_amount, notes) VALUES (?, ?, ?)",
        [user_id, totalAmount, purchaseNotes]
      );

      const purchaseId = purchaseResult.insertId;
      const previousCosts = new Map();

      for (const item of items) {
        const [[product]] = conn.query(
          "SELECT cost_price FROM products WHERE product_id = ? AND user_id = ?",
          [item.product_id, user_id]
        );
        if (!previousCosts.has(item.product_id)) previousCosts.set(item.product_id, product.cost_price);
        conn.query(
          "INSERT INTO purchase_items (purchase_id, product_id, quantity, price, previous_cost_price) VALUES (?, ?, ?, ?, ?)",
          [purchaseId, item.product_id, item.quantity, item.price, previousCosts.get(item.product_id)]
        );
        conn.query(
          "UPDATE products SET cost_price = ? WHERE product_id = ? AND user_id = ?",
          [item.price, item.product_id, user_id]
        );
      }
      for (const [productId, quantity] of items.reduce((map, item) => {
        map.set(item.product_id, (map.get(item.product_id) || 0) + item.quantity);
        return map;
      }, new Map())) {
        conn.query(
          "UPDATE products SET total_quantity = total_quantity + ? WHERE product_id = ? AND user_id = ?",
          [quantity, productId, user_id]
        );
      }

      return purchaseId;
    });

    res.status(201).json({
      message: "Purchase recorded successfully",
      purchase_id: purchaseId
    });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("Error creating purchase:", err);
    res.status(status).json({ message: status < 500 ? err.message : "Error creating purchase" });
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
  const user_id = req.user.id;
  let items;
  let purchaseNotes;

  try {
    items = normalizePurchaseItems(req.body.items);
    purchaseNotes = cleanNotes(req.body.notes);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }

  try {
    withTransaction((conn) => {
      const [[purchase]] = conn.query(
        "SELECT * FROM purchases WHERE id = ? AND user_id = ?",
        [purchase_id, user_id]
      );
      if (!purchase) throw requestError("Purchase not found.", 404);

      const [existingItems] = conn.query(
        "SELECT id, product_id, quantity, price, previous_cost_price FROM purchase_items WHERE purchase_id = ? ORDER BY id",
        [purchase_id]
      );

      restoreLatestCosts(conn, purchase, user_id, existingItems);

      for (const item of existingItems) {
        const [update] = conn.query(
          `UPDATE products SET total_quantity = total_quantity - ?
           WHERE product_id = ? AND user_id = ? AND total_quantity >= ?`,
          [item.quantity, item.product_id, user_id, item.quantity]
        );
        if (update.affectedRows !== 1) {
          throw requestError("This purchase cannot be edited because some of its stock has already been sold.", 409);
        }
      }

      conn.query("DELETE FROM purchase_items WHERE purchase_id = ?", [purchase_id]);

      const previousCosts = new Map();
      for (const item of items) {
        const [[product]] = conn.query(
          "SELECT product_id FROM products WHERE product_id = ? AND user_id = ?",
          [item.product_id, user_id]
        );
        if (!product) throw requestError(`Product ${item.product_id} was not found in your catalog.`, 404);
      }

      for (const item of items) {
        const [[product]] = conn.query(
          "SELECT cost_price FROM products WHERE product_id = ? AND user_id = ?",
          [item.product_id, user_id]
        );
        if (!previousCosts.has(item.product_id)) previousCosts.set(item.product_id, product.cost_price);
        conn.query(
          "INSERT INTO purchase_items (purchase_id, product_id, quantity, price, previous_cost_price) VALUES (?, ?, ?, ?, ?)",
          [purchase_id, item.product_id, item.quantity, item.price, previousCosts.get(item.product_id)]
        );
        if (!hasLaterPurchaseForProduct(conn, purchase, user_id, item.product_id)) {
          conn.query(
            "UPDATE products SET cost_price = ? WHERE product_id = ? AND user_id = ?",
            [item.price, item.product_id, user_id]
          );
        }
      }

      for (const [productId, quantity] of items.reduce((map, item) => {
        map.set(item.product_id, (map.get(item.product_id) || 0) + item.quantity);
        return map;
      }, new Map())) {
        conn.query(
          "UPDATE products SET total_quantity = total_quantity + ? WHERE product_id = ? AND user_id = ?",
          [quantity, productId, user_id]
        );
      }

      const totalAmount = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
      conn.query(
        "UPDATE purchases SET total_amount = ?, notes = ? WHERE id = ?",
        [totalAmount, purchaseNotes, purchase_id]
      );
    });

    res.json({ message: "Purchase updated successfully" });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("Error updating purchase:", err);
    res.status(status).json({ message: status < 500 ? err.message : "Error updating purchase" });
  }
};

//Delete a purchase 
exports.deletePurchase = async (req, res) => {
  const { purchase_id } = req.params;
  const user_id = req.user.id;

  try {
    withTransaction((conn) => {
      const [[purchase]] = conn.query(
        "SELECT * FROM purchases WHERE id = ? AND user_id = ?",
        [purchase_id, user_id]
      );

      if (!purchase) {
        throw requestError("Purchase not found.", 404);
      }

      const [items] = conn.query(
        "SELECT id, product_id, quantity, price, previous_cost_price FROM purchase_items WHERE purchase_id = ? ORDER BY id",
        [purchase_id]
      );

      restoreLatestCosts(conn, purchase, user_id, items);

      for (const { product_id, quantity } of items) {
        const [update] = conn.query(
          `UPDATE products SET total_quantity = total_quantity - ?
           WHERE product_id = ? AND user_id = ? AND total_quantity >= ?`,
          [quantity, product_id, user_id, quantity]
        );
        if (update.affectedRows !== 1) {
          throw requestError("This purchase cannot be deleted because some of its stock has already been sold.", 409);
        }
      }

      conn.query("DELETE FROM purchases WHERE id = ? AND user_id = ?", [purchase_id, user_id]);
    });

    res.json({ message: "Purchase deleted successfully" });
  } catch (err) {
    const status = err.statusCode || 500;
    if (status >= 500) console.error("Error deleting purchase:", err);
    res.status(status).json({ message: status < 500 ? err.message : "Error deleting purchase" });
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
         AND date(purchase_date) = date('now')`,
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
         AND date(purchase_date) >= date('now', '-30 days')
       GROUP BY date(purchase_date)
       ORDER BY date(purchase_date) ASC`,
      [user_id]
    );

    res.json(rows);          // [{ "date":"2025-06-03", "total": 123.45 }, …]
  } catch (err) {
    console.error("Error in getDailyPurchases:", err);
    res.status(500).json({ message: "Error fetching daily purchases" });
  }
};
