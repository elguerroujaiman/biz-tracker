const router = require("express").Router();
const authenticateToken = require("../middleware/authMiddleware");
const analytics = require("../controllers/analyticsController");

router.get("/net-revenue", authenticateToken, analytics.getNetRevenue);
router.get("/top-net-product", authenticateToken, analytics.getTopNetProduct);
router.get("/earnings-per-product", authenticateToken, analytics.getEarningsPerProduct);
router.get("/product-activity", authenticateToken, analytics.getProductActivity);
router.get("/product-revenue",authenticateToken,analytics.getProductRevenue);

module.exports = router;