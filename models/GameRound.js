const mongoose = require("mongoose");

const betSchema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
  usdAmount: Number,
  cryptoAmount: Number,
  currency: String,
  cashoutMultiplier: Number,
  cashedOut: Boolean
});

const gameRoundSchema = new mongoose.Schema({
  roundId: { type: String, required: true, unique: true },
  crashPoint: { type: Number, required: true },
  bets: [betSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("GameRound", gameRoundSchema);
