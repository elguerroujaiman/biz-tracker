const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const authenticateToken = require("../middleware/authMiddleware");

// Get current user's settings
router.get("/", authenticateToken, settingsController.getSettings);

// Update current user's settings
router.put("/", authenticateToken, settingsController.updateSettings);

// Get only the user's currency symbol
router.get("/currency-symbol", authenticateToken, settingsController.getCurrencySymbol);

module.exports = router;