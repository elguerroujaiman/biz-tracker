const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

const authRoutes = require("./routes/authRoutes");              // <-- added
const productRoutes = require("./routes/productRoutes");        // <-- added
const salesRoutes = require("./routes/sales");

dotenv.config();

const app = express();

const corsOptions = {
  origin: "http://localhost:3001",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],           // <-- added Authorization for token later
};

app.use(cors(corsOptions));
app.use(express.json());

// Database connection (you can optionally move to a separate file)
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
app.use("/api/auth", authRoutes);         // Handles /login etc.
app.use("/api/products", productRoutes);  // Handles product APIs
app.use("/api/sales", salesRoutes);
// Start the server
app.listen(5000, () => {
  console.log("Server running on port 5000");
});