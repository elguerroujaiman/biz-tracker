const db = require("../config/db");

// GET user settings
exports.getSettings = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT currency_symbol, theme FROM user_settings WHERE user_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      // Insert default settings if none exist (optional but still safe)
      await db.query(
        "INSERT INTO user_settings (user_id) VALUES (?)",
        [userId]
      );
      return res.json({ currency_symbol: "$", theme: "light" });
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
  const { currency_symbol, theme } = req.body;

  try {
    await db.query(
      `
      INSERT INTO user_settings (user_id, currency_symbol, theme)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        currency_symbol = VALUES(currency_symbol),
        theme = VALUES(theme),
        updated_at = CURRENT_TIMESTAMP
      `,
      [userId, currency_symbol, theme]
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
      // Return default symbol if not found
      return res.json({ currency_symbol: "$" });
    }

    res.json({ currency_symbol: row.currency_symbol || "$" });
  } catch (err) {
    console.error("Error fetching currency symbol:", err);
    res.status(500).json({ error: "Failed to fetch currency symbol" });
  }
};