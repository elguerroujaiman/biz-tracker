"use strict";

const dotenv = require("dotenv");
dotenv.config();

const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes      = require("./routes/authRoutes");
const productRoutes   = require("./routes/productRoutes");
const salesRoutes     = require("./routes/sales");
const purchaseRoutes  = require("./routes/purchases");
const analyticsRoutes = require("./routes/analytics");
const settingsRoutes  = require("./routes/settingsRoutes");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Security headers ─────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "style-src": ["'self'", "'unsafe-inline'"],
      "style-src-attr": ["'unsafe-inline'"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
    },
  },
}));

// Trust forwarded client addresses only when the deployment sits behind a proxy.
const trustProxy = process.env.TRUST_PROXY;
if (trustProxy === "true") app.set("trust proxy", true);
else if (trustProxy && /^\d+$/.test(trustProxy)) app.set("trust proxy", Number(trustProxy));
else if (trustProxy && trustProxy !== "false") app.set("trust proxy", trustProxy);

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      // Non-browser clients such as curl do not send an Origin header.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsing (with size limit to prevent payload attacks) ────────────────
app.use(express.json({ limit: "1mb" }));

// ── Global rate limiter (generous — tighter limits are per-route) ────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",      authRoutes);
app.use("/api/products",  productRoutes);
app.use("/api/sales",     salesRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/settings",  settingsRoutes);

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large." });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }
  if (err.message?.startsWith("CORS:")) {
    return res.status(403).json({ message: "Origin is not allowed." });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
