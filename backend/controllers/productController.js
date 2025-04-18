const db = require("../config/db"); // Reuse the shared DB pool

// GET all products for the logged-in user
exports.getAllProducts = async (req, res) => {
  const userId = req.user.id;

  try {
    const [results] = await db.query("SELECT * FROM products WHERE user_id = ?", [userId]);
    res.json(results);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// CREATE a new product for logged-in user
exports.createProduct = async (req, res) => {
  const { name, category, unit_price, total_quantity } = req.body;
  const userId = req.user?.id;

  console.log("Incoming product data:", { name, category, unit_price, total_quantity, userId });

  if (!name || !unit_price || !total_quantity || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO products (name, category, unit_price, total_quantity, user_id) VALUES (?, ?, ?, ?, ?)",
      [name, category, unit_price, total_quantity, userId]
    );
    res.status(201).json({ message: "Product created", id: result.insertId });
  } catch (err) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: "Failed to create product" });
  }
};

// UPDATE product only if it belongs to the user
exports.updateProduct = async (req, res) => {
  const { name, category, unit_price, total_quantity } = req.body;
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      "UPDATE products SET name = ?, category = ?, unit_price = ?, total_quantity = ? WHERE product_id = ? AND user_id = ?",
      [name, category, unit_price, total_quantity, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: "Unauthorized update" });
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
      return res.status(403).json({ error: "Unauthorized delete" });
    }

    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: "Failed to delete product" });
  }
};