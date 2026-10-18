const jwt = require("jsonwebtoken");
const JWT_SECRET = require("../config/jwt");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  const [scheme, token] = (authHeader || "").split(" ");

  if (scheme !== "Bearer" || !token) return res.status(401).json({ message: "Authentication required." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(401).json({ message: "Session expired. Please sign in again." });
    req.user = user; // user contains { id, email } from login
    next();
  });
};

module.exports = authenticateToken;
