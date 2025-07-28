// server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const connectDB = require("./config/db");
const gameRoutes = require("./routes/gameRoutes");
const walletRoutes = require("./routes/walletRoutes");

const { getPrices } = require("./services/priceService");
const { placeBet, cashOut } = require("./services/transactionService");
const { startGame } = require("./sockets/gameSocket");
const Player = require("./models/Player");

// ✅ Preload crypto prices before game starts
(async () => {
  try {
    await getPrices();
    console.log("✅ Crypto prices preloaded.");
  } catch (err) {
    console.error("⚠️ Failed to preload crypto prices:", err.message);
  }
})();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/", express.static(path.join(__dirname, "client"))); // Serve frontend
app.use("/game", gameRoutes);
app.use("/wallet", walletRoutes);

// Health check
app.get("/", (req, res) => {
  res.send("✅ Crypto Crash Server is running...");
});

// ✅ Real-time prices
app.get("/prices", async (req, res) => {
  try {
    const prices = await getPrices();
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get playerId by username
app.get("/api/player-id", async (req, res) => {
  const { username } = req.query;
  const player = await Player.findOne({ username });
  if (!player) return res.status(404).json({ error: "Player not found" });
  res.json({ playerId: player._id });
});

// ✅ Place bet
app.post("/bet", async (req, res) => {
  const { username, usdAmount, currency } = req.body;
  try {
    const result = await placeBet({ username, usdAmount, currency });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Cash out
app.post("/cashout", async (req, res) => {
  const { playerId, cryptoAmount, currency, multiplier } = req.body;
  try {
    const result = await cashOut({ playerId, cryptoAmount, currency, multiplier });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ TEMPORARY: Seed player data route
app.get("/seed-players", async (req, res) => {
  try {
    await Player.deleteMany();
    await Player.insertMany([
      { username: "anurag", wallet: { BTC: 0.01, ETH: 0.5 } },
      { username: "saurav", wallet: { BTC: 0.005, ETH: 0.2 } }
    ]);
    res.send("✅ Seeded players successfully!");
  } catch (err) {
    res.status(500).send("❌ Seeding failed: " + err.message);
  }
});

// ✅ WebSocket connection
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ⏱️ Start crash game loop
startGame(io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
