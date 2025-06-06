const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const authenticateToken = require("../middleware/authMiddleware");

router.get("/", authenticateToken, productController.getAllProducts);
router.post("/", authenticateToken, productController.createProduct);
router.get("/low-stock", authenticateToken, productController.getLowStockProducts);
router.put("/:id", authenticateToken, productController.updateProduct);
router.delete("/:id", authenticateToken, productController.deleteProduct);

module.exports = router;