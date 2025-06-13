const router = require("express").Router();
const authenticateToken = require("../middleware/authMiddleware");
const analytics = require("../controllers/analyticsController");

router.get("/net-revenue", authenticateToken, analytics.getNetRevenue);
router.get("/top-net-product", authenticateToken, analytics.getTopNetProduct);

module.exports = router;