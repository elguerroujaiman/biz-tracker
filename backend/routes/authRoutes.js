"use strict";

const express   = require("express");
const rateLimit = require("express-rate-limit");
const { body, validationResult } = require("express-validator");

const router         = express.Router();
const authController = require("../controllers/authController");

// ── Stricter rate limit for auth endpoints (brute-force protection) ──────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
});

// ── Validation middleware ─────────────────────────────────────────────────────
const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 1, max: 72 })
    .custom((password) => typeof password === "string" && Buffer.byteLength(password, "utf8") <= 72)
    .withMessage("Password is required and must not exceed 72 bytes"),
];

const validateRegister = [
  body("username")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Username must be 2–50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8, max: 72 })
    .withMessage("Password must be 8 to 72 characters")
    .custom((password) => typeof password === "string" && Buffer.byteLength(password, "utf8") <= 72)
    .withMessage("Password must not exceed 72 UTF-8 bytes")
    .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/).withMessage("Password must contain a number"),
];

// ── Validation result handler ─────────────────────────────────────────────────
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: errors.array()[0].msg });
  }
  next();
}

// ── Routes ────────────────────────────────────────────────────────────────────
router.post("/login",    authLimiter, validateLogin,    handleValidation, authController.login);
router.post("/register", authLimiter, validateRegister, handleValidation, authController.register);

module.exports = router;
