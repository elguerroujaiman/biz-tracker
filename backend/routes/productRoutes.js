const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authenticateToken = require("../middleware/authMiddleware");

// Get all products 
router.get("/", authenticateToken, productController.getAllProducts);

// Create a new product 
router.post("/", authenticateToken, productController.createProduct);

// Get only low-stock products
router.get("/low-stock", authenticateToken, productController.getLowStockProducts);

// Update a product 
router.put("/:id", authenticateToken, productController.updateProduct);

// Delete a product
router.delete("/:id", authenticateToken, productController.deleteProduct);

module.exports = router;