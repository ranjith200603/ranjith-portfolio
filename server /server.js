const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

/* =========================
   MIDDLEWARE
========================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));


/* =========================
   BASIC ROUTE
========================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Ranjith Portfolio API is running 🚀",
  });
});


/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    server: "online",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});


/* =========================
   MONGODB CONNECTION
========================= */

const connectDatabase = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log("⚠️ MONGO_URI is missing");
      return;
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error(
      "❌ MongoDB connection failed:",
      error.message
    );
  }
};


/* =========================
   START SERVER
========================= */

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(
      `🚀 Server running on http://localhost:${PORT}`
    );
  });
};

startServer();
