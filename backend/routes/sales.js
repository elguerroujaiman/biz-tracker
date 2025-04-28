const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");
const authenticateToken = require("../middleware/authMiddleware"); // or wherever your auth middleware is

router.post("/", authenticateToken, salesController.createSale);
router.get("/", authenticateToken, salesController.getSales);
router.get("/stats", authenticateToken, salesController.getSalesStats);
router.get("/:sale_id", authenticateToken, salesController.getSaleById);

module.exports = router;