const mongoose = require("mongoose");

const walletSchema = {
  BTC: { type: Number, default: 0 },
  ETH: { type: Number, default: 0 }
};

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  wallet: walletSchema
}, { timestamps: true });

module.exports = mongoose.model("Player", playerSchema);
