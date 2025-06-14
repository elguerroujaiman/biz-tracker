const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authenticateToken = require("../middleware/authMiddleware");

// Get all products (includes low_stock_threshold in result)
router.get("/", authenticateToken, productController.getAllProducts);

// Create a new product (accepts low_stock_threshold)
router.post("/", authenticateToken, productController.createProduct);

// Get only low-stock products
router.get("/low-stock", authenticateToken, productController.getLowStockProducts);

// Update a product (allows updating low_stock_threshold)
router.put("/:id", authenticateToken, productController.updateProduct);

// Delete a product
router.delete("/:id", authenticateToken, productController.deleteProduct);

module.exports = router;