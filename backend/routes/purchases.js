const express = require("express");
const router = express.Router();
const purchasesController = require("../controllers/purchasesController");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/", authenticateToken, purchasesController.createPurchase);
router.get("/", authenticateToken, purchasesController.getPurchases);
router.get("/stats", authenticateToken, purchasesController.getPurchaseStats);
router.get("/:purchase_id", authenticateToken, purchasesController.getPurchaseById);
router.put("/:purchase_id", authenticateToken, purchasesController.updatePurchase);

module.exports = router;