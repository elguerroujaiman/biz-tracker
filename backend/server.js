const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const salesRoutes = require("./routes/sales");
const purchaseRoutes = require("./routes/purchases");
const analyticsRoutes = require("./routes/analytics");
const settingsRoutes = require("./routes/settingsRoutes");

dotenv.config();

const app = express();

const corsOptions = {
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchases", purchaseRoutes); 
app.use("/api/settings", settingsRoutes);
app.use("/api/analytics", analyticsRoutes);

// Start the server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});