const Player = require("../models/Player");
const Transaction = require("../models/Transaction");
const { getPrices } = require("./priceService");
const { v4: uuidv4 } = require("uuid");

const placeBet = async ({ username, usdAmount, currency }) => {
  console.log("📥 Placing bet for:", username);

  if (usdAmount <= 0) {
    throw new Error("Invalid USD amount");
  }

  const prices = await getPrices();
  const price = prices[currency];
  if (!price) throw new Error("Unsupported currency");

  const cryptoAmount = usdAmount / price;

  const player = await Player.findOne({ username });
  if (!player) throw new Error("Player not found");

  if (player.wallet[currency] < cryptoAmount) {
    throw new Error("Insufficient balance");
  }

  // Deduct from wallet
  player.wallet[currency] -= cryptoAmount;
  await player.save();

  const transactionHash = `tx_${uuidv4()}`;

  // ✅ Log the transaction with error catch
  try {
    await Transaction.create({
      playerId: player._id,
      usdAmount,
      cryptoAmount,
      currency,
      transactionType: "bet",
      transactionHash,
      priceAtTime: price
    });
    console.log("✅ Bet transaction saved to DB");
  } catch (err) {
    console.error("❌ Failed to save bet transaction:", err.message);
  }

  return {
    playerId: player._id,
    usdAmount,
    cryptoAmount,
    currency,
    priceAtTime: price,
    transactionHash
  };
};

const cashOut = async ({ playerId, cryptoAmount, currency, multiplier }) => {
  console.log("💸 Cashing out for:", playerId);

  const prices = await getPrices();
  const price = prices[currency];
  if (!price) throw new Error("Unsupported currency");

  const payoutCrypto = cryptoAmount * multiplier;
  const usdEquivalent = payoutCrypto * price;

  const player = await Player.findById(playerId);
  if (!player) throw new Error("Player not found");

  // Credit wallet
  player.wallet[currency] += payoutCrypto;
  await player.save();

  const transactionHash = `tx_${uuidv4()}`;

  // ✅ Log the transaction with error catch
  try {
    await Transaction.create({
      playerId,
      usdAmount: usdEquivalent,
      cryptoAmount: payoutCrypto,
      currency,
      transactionType: "cashout",
      transactionHash,
      priceAtTime: price
    });
    console.log("✅ Cashout transaction saved to DB");
  } catch (err) {
    console.error("❌ Failed to save cashout transaction:", err.message);
  }

  return {
    playerId,
    cryptoAmount: payoutCrypto,
    currency,
    usdEquivalent,
    priceAtTime: price,
    transactionHash
  };
};

module.exports = {
  placeBet,
  cashOut
};
