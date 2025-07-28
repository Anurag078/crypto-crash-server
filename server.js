// server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const path = require("path");

// Local modules
const connectDB = require("./config/db");
const gameRoutes = require("./routes/gameRoutes");
const walletRoutes = require("./routes/walletRoutes");
const { getPrices } = require("./services/priceService");
const { placeBet, cashOut } = require("./services/transactionService");
const { startGame } = require("./sockets/gameSocket");
const Player = require("./models/Player");

// Connect to MongoDB
connectDB();

// App setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // For production, specify your frontend domain
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/", express.static(path.join(__dirname, "client"))); // Static frontend
app.use("/game", gameRoutes);
app.use("/wallet", walletRoutes);

// ✅ Health Check
app.get("/", (req, res) => {
  res.send("✅ Crypto Crash Server is running...");
});

// ✅ Real-Time Crypto Prices
app.get("/prices", async (req, res) => {
  try {
    const prices = await getPrices();
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get Player ID by Username
app.get("/api/player-id", async (req, res) => {
  try {
    const { username } = req.query;
    const player = await Player.findOne({ username });
    if (!player) return res.status(404).json({ error: "Player not found" });
    res.json({ playerId: player._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Place Bet
app.post("/bet", async (req, res) => {
  const { username, usdAmount, currency } = req.body;
  try {
    const result = await placeBet({ username, usdAmount, currency });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Cash Out
app.post("/cashout", async (req, res) => {
  const { playerId, cryptoAmount, currency, multiplier } = req.body;
  try {
    const result = await cashOut({ playerId, cryptoAmount, currency, multiplier });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ WebSocket Connection
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Start the game loop
startGame(io);

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
