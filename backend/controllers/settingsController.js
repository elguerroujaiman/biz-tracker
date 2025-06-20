const db = require("../config/db");
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
      // Insert default settings if none exist
      await db.query(
        "INSERT INTO user_settings (user_id, currency_symbol) VALUES (?, ?)",
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

// UPDATE user settings
exports.updateSettings = async (req, res) => {
  const userId = req.user.id;
  const { currency_symbol } = req.body;

  try {
    await db.query(
      `
      INSERT INTO user_settings (user_id, currency_symbol)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
        currency_symbol = VALUES(currency_symbol),
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, currency_symbol]
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

    if (!row) {
      return res.json({ currency_symbol: "$" });
    }

    res.json({ currency_symbol: row.currency_symbol || "$" });
  } catch (err) {
    console.error("Error fetching currency symbol:", err);
    res.status(500).json({ error: "Failed to fetch currency symbol" });
  }
};

// CHANGE user password
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    // Get current hashed password
    const [[user]] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, userId]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error changing password:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
};