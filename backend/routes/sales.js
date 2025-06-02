const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/", authenticateToken, salesController.createSale);
router.get("/", authenticateToken, salesController.getSales);
router.get("/stats", authenticateToken, salesController.getSalesStats);
router.get("/:sale_id", authenticateToken, salesController.getSaleById);
router.put("/:sale_id", authenticateToken, salesController.updateSale);
router.delete("/:sale_id", authenticateToken, salesController.deleteSale);

module.exports = router;