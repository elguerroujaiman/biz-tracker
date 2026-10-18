"use strict";

const db     = require("../config/db");
const bcrypt = require("bcryptjs");

// GET user settings
exports.getSettings = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT currency_symbol FROM user_settings WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      // Insert default settings if none exist (SQLite compatible)
      await db.query(
        "INSERT OR IGNORE INTO user_settings (user_id, currency_symbol) VALUES (?, ?)",
        [userId, "$"]
      );
      return res.json({ currency_symbol: "$" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("Error fetching user settings:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

// UPDATE user settings (SQLite-compatible upsert)
exports.updateSettings = async (req, res) => {
  const userId = req.user.id;
  const { currency_symbol } = req.body;
  const supportedCurrencies = new Set(["$", "\u20ac", "DH", "\u00a3", "CAD$", "CHF"]);

  if (typeof currency_symbol !== "string" || !supportedCurrencies.has(currency_symbol.trim())) {
    return res.status(400).json({ error: "Choose a supported currency symbol." });
  }

  try {
    await db.query(
      `INSERT INTO user_settings (user_id, currency_symbol, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         currency_symbol = excluded.currency_symbol,
         updated_at      = datetime('now')`,
      [userId, currency_symbol.trim()]
    );

    res.json({ message: "Settings updated successfully" });
  } catch (err) {
    console.error("Error updating user settings:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
};

// GET only the user's currency symbol
exports.getCurrencySymbol = async (req, res) => {
  const userId = req.user.id;

  try {
    const [[row]] = await db.query(
      "SELECT currency_symbol FROM user_settings WHERE user_id = ?",
      [userId]
    );

    res.json({ currency_symbol: row?.currency_symbol || "$" });
  } catch (err) {
    console.error("Error fetching currency symbol:", err);
    res.status(500).json({ error: "Failed to fetch currency symbol" });
  }
};

// CHANGE user password
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "Both currentPassword and newPassword are required" });
  }

  if (newPassword.length < 8 || newPassword.length > 72 || Buffer.byteLength(newPassword, "utf8") > 72) {
    return res.status(400).json({ error: "New password must be 8 to 72 characters and no more than 72 UTF-8 bytes." });
  }

  try {
    const [[user]] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
};
