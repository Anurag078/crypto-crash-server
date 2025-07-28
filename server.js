""// server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const connectDB = require("./config/db");
const gameRoutes = require("./routes/gameRoutes");
const walletRoutes = require("./routes/walletRoutes");
// Service imports
const { getPrices } = require("./services/priceService");
const { placeBet, cashOut } = require("./services/transactionService"); // ✅ both imported here
const { startGame } = require("./sockets/gameSocket"); // Import startGame
const Player = require("./models/Player"); // ✅ Import Player model

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your frontend URL in production
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use("/", express.static(path.join(__dirname, "client"))); 
app.use("/game", gameRoutes);
app.use("/wallet", walletRoutes);
// ✅ Routes

// Health check
app.get("/", (req, res) => {
  res.send("✅ Crypto Crash Server is running...");
});

// Prices route
app.get("/prices", async (req, res) => {
  try {
    const prices = await getPrices();
    res.json(prices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Player ID by username
app.get("/api/player-id", async (req, res) => {
  const { username } = req.query;
  const player = await Player.findOne({ username });
  if (!player) return res.status(404).json({ error: "Player not found" });
  res.json({ playerId: player._id });
});

// Place Bet
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

// ✅ WebSocket Logic
io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });

  // You can add your game logic socket events here
});

// ⏱️ Start the game loop
startGame(io); // Start the game loop after setting up the connection

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
