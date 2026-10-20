
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

const marketData = {
  Wheat: [
    { name: "Mathura Mandi", distance: 8, price: 2500, transport: 400, other: 300 },
    { name: "Agra Mandi", distance: 42, price: 2650, transport: 1400, other: 400 },
    { name: "Hathras Mandi", distance: 35, price: 2580, transport: 1100, other: 350 },
  ],
  Rice: [
    { name: "Mathura Mandi", distance: 8, price: 3200, transport: 400, other: 300 },
    { name: "Agra Mandi", distance: 42, price: 3400, transport: 1400, other: 400 },
    { name: "Hathras Mandi", distance: 35, price: 3300, transport: 1100, other: 350 },
  ],
  Potato: [
    { name: "Mathura Mandi", distance: 8, price: 1200, transport: 400, other: 300 },
    { name: "Agra Mandi", distance: 42, price: 1450, transport: 1400, other: 400 },
    { name: "Hathras Mandi", distance: 35, price: 1350, transport: 1100, other: 350 },
  ],
};

app.get("/api/markets", (req, res) => {
  const { crop, quantity } = req.query;
  const qty = Number(quantity);

  if (!marketData[crop]) {
    return res.status(400).json({
      success: false,
      message: "Unsupported crop",
    });
  }

  if (
    quantity === undefined ||
    quantity.trim() === "" ||
    !Number.isFinite(qty) ||
    qty <= 0 ||
    qty > 100000
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid quantity between 0 and 100000 quintals",
    });
  }

  const markets = marketData[crop]
    .map((market) => ({
      ...market,
      gross: market.price * qty,
      costs: market.transport + market.other,
      net: market.price * qty - market.transport - market.other,
    }))
    .sort((a, b) => b.net - a.net);

  return res.json({
    success: true,
    crop,
    quantity: qty,
    markets,
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
