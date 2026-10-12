
const express = require("express");
const cors = require("cors");

const app = express();

// Allow requests from our Vite frontend.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

// Parse incoming JSON request bodies.
app.use(express.json());

// Basic health-check endpoint.
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AgriBridge API is running!",
    service: "backend",
    timestamp: new Date().toISOString(),
  });
});

// Handle unknown API routes.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

module.exports = app;
