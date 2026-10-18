const db = require("../config/db"); // Reuse the shared DB pool

function normalizeProduct(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const unit_price = Number(body.unit_price);
  const cost_price = Number(body.cost_price ?? body.unit_price);
  const total_quantity = Number(body.total_quantity);
  const low_stock_threshold = Number(body.low_stock_threshold ?? 0);

  if (!name || name.length > 100) throw new Error("Product name is required and must be 100 characters or fewer.");
  if (category.length > 60) throw new Error("Category must be 60 characters or fewer.");
  if (!Number.isFinite(unit_price) || unit_price < 0 || unit_price > 1000000000) {
    throw new Error("Selling price must be a valid non-negative number.");
  }
  if (!Number.isFinite(cost_price) || cost_price < 0 || cost_price > 1000000000) {
    throw new Error("Cost price must be a valid non-negative number.");
  }
  if (!Number.isSafeInteger(total_quantity) || total_quantity < 0) {
    throw new Error("Quantity must be a non-negative whole number.");
  }
  if (!Number.isSafeInteger(low_stock_threshold) || low_stock_threshold < 0) {
    throw new Error("Low-stock threshold must be a non-negative whole number.");
  }

  return { name, category: category || null, unit_price, cost_price, total_quantity, low_stock_threshold };
}

// GET all products for the logged-in user with optional sorting
exports.getAllProducts = async (req, res) => {
  const userId = req.user.id;
  const allowedSortFields = [
    "name",
    "category",
    "total_quantity",
    "unit_price",
    "cost_price",
    "created_at",
    "updated_at",
  ];

  // Get sorting params from query
  let { sortBy = "name", order = "asc" } = req.query;

  // Validate sort field and direction
  sortBy = allowedSortFields.includes(sortBy) ? sortBy : "name";
  order = order.toLowerCase() === "desc" ? "DESC" : "ASC";

  try {
    const [results] = await db.query(
      `SELECT * FROM products WHERE user_id = ? ORDER BY ${sortBy} ${order}`,
      [userId]
    );
    res.json(results);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// CREATE a new product for logged-in user
exports.createProduct = async (req, res) => {
  const userId = req.user?.id;
  let product;

  try {
    product = normalizeProduct(req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
  if (!userId) return res.status(401).json({ error: "Authentication required." });

  try {
    const [existing] = await db.query(
      "SELECT 1 FROM products WHERE lower(name) = lower(?) AND user_id = ? LIMIT 1",
      [product.name, userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: "A product with this name already exists." });
    }

    const [result] = await db.query(
      "INSERT INTO products (name, category, unit_price, cost_price, total_quantity, low_stock_threshold, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [product.name, product.category, product.unit_price, product.cost_price, product.total_quantity, product.low_stock_threshold, userId]
    );

    res.status(201).json({ message: "Product created", id: result.insertId });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(err.code === "SQLITE_CONSTRAINT_UNIQUE" ? 409 : 500).json({
      error: err.code === "SQLITE_CONSTRAINT_UNIQUE" ? "A product with this name already exists." : "Failed to create product",
    });
  }
};

// UPDATE product only if it belongs to the user
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  let product;

  try {
    product = normalizeProduct(req.body);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  try {
    const [existing] = await db.query(
      "SELECT product_id FROM products WHERE lower(name) = lower(?) AND user_id = ? AND product_id <> ? LIMIT 1",
      [product.name, userId, id]
    );
    if (existing.length > 0) return res.status(409).json({ error: "A product with this name already exists." });

    const [result] = await db.query(
      "UPDATE products SET name = ?, category = ?, unit_price = ?, cost_price = ?, total_quantity = ?, low_stock_threshold = ? WHERE product_id = ? AND user_id = ?",
      [product.name, product.category, product.unit_price, product.cost_price, product.total_quantity, product.low_stock_threshold, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json({ message: "Product updated" });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
};

// DELETE product only if it belongs to the user
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      "DELETE FROM products WHERE product_id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("Error deleting product:", err);
    if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      return res.status(409).json({ error: "This product has sales or purchase history and cannot be deleted." });
    }
    res.status(500).json({ error: "Failed to delete product" });
  }
};

// GET low stock products (based on each product's own threshold)
exports.getLowStockProducts = async (req, res) => {
  const userId = req.user.id;

  try {
    const [results] = await db.query(
      `SELECT product_id, name, category, total_quantity, low_stock_threshold 
       FROM products 
       WHERE user_id = ? 
         AND low_stock_threshold IS NOT NULL 
         AND total_quantity <= low_stock_threshold`,
      [userId]
    );

    res.json(results);
  } catch (err) {
    console.error("Error fetching low stock products:", err);
    res.status(500).json({ error: "Failed to fetch low stock products" });
  }
};
