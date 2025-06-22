const express = require("express");
const router = express.Router();
const purchasesController = require("../controllers/purchasesController");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/", authenticateToken, purchasesController.createPurchase);
router.get("/", authenticateToken, purchasesController.getPurchases);
router.get("/summary", authenticateToken, purchasesController.getPurchaseSummary);
router.get("/daily", authenticateToken, purchasesController.getDailyPurchases);
router.get("/stats", authenticateToken, purchasesController.getPurchaseStats);
router.get("/:purchase_id", authenticateToken, purchasesController.getPurchaseById);
router.put("/:purchase_id", authenticateToken, purchasesController.updatePurchase);
router.delete("/:purchase_id", authenticateToken, purchasesController.deletePurchase);

module.exports = router;