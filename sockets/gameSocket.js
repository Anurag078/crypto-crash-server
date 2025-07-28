const { generateCrashPoint } = require("../services/crashAlgo");
const GameRound = require("../models/GameRound");
const Player = require("../models/Player");
const Transaction = require("../models/Transaction");
const { getPrices } = require("../services/priceService");
const { v4: uuidv4 } = require("uuid");

let currentMultiplier = 1;
let gameInterval;
let crashPoint = null;
let roundNumber = 1;
let seed = "static_seed_123"; // Change if needed
let activeBets = {}; // playerId → { cryptoAmount, currency, usdAmount }
let activeRoundId = null; // ✅ Fix: track current roundId

async function startGame(io) {
  setInterval(async () => {
    currentMultiplier = 1;
    crashPoint = generateCrashPoint(seed, roundNumber);
    activeBets = {}; // reset active bets

    // ✅ Track current round ID globally
    activeRoundId = `round_${Date.now()}`;
    const newRound = await GameRound.create({
      roundId: activeRoundId,
      crashPoint,
      bets: []
    });

    io.emit("round_start", {
      roundId: activeRoundId,
      crashPoint,
      message: "New round started!"
    });

    let intervalTick = 0;
    gameInterval = setInterval(async () => {
      currentMultiplier = parseFloat((1 + intervalTick * 0.01).toFixed(2));

      if (currentMultiplier >= crashPoint) {
        clearInterval(gameInterval);
        io.emit("round_crash", {
          crashPoint,
          message: `💥 Game crashed at ${crashPoint}x`
        });

        for (const playerId in activeBets) {
          const bet = activeBets[playerId];
          newRound.bets.push({
            playerId,
            ...bet,
            cashoutMultiplier: null,
            cashedOut: false
          });
        }
        await newRound.save();

        roundNumber++;
      } else {
        io.emit("multiplier_update", { multiplier: currentMultiplier });
      }

      intervalTick++;
    }, 100);
  }, 15000);

  io.on("connection", (socket) => {
    console.log("🟢 WebSocket: ", socket.id);

    socket.on("place_bet", async ({ username, usdAmount, currency }) => {
      try {
        const prices = await getPrices();
        const price = prices[currency];
        const player = await Player.findOne({ username });
        if (!player) return;

        const cryptoAmount = usdAmount / price;
        if (player.wallet[currency] < cryptoAmount) {
          socket.emit("error", "Insufficient balance");
          return;
        }

        player.wallet[currency] -= cryptoAmount;
        await player.save();

        activeBets[player._id] = {
          usdAmount,
          cryptoAmount,
          currency
        };

        await Transaction.create({
          playerId: player._id,
          usdAmount,
          cryptoAmount,
          currency,
          transactionType: "bet",
          transactionHash: "tx_" + uuidv4(),
          priceAtTime: price
        });

        socket.emit("bet_accepted", { usdAmount, currency, cryptoAmount });
      } catch (err) {
        socket.emit("error", err.message);
      }
    });

    socket.on("cashout", async ({ playerId }) => {
      try {
        const bet = activeBets[playerId];
        if (!bet) {
          socket.emit("error", "No active bet found");
          return;
        }

        const prices = await getPrices();
        const price = prices[bet.currency];
        const cryptoAmount = bet.cryptoAmount * currentMultiplier;

        const player = await Player.findById(playerId);
        player.wallet[bet.currency] += cryptoAmount;
        await player.save();

        await Transaction.create({
          playerId,
          usdAmount: cryptoAmount * price,
          cryptoAmount,
          currency: bet.currency,
          transactionType: "cashout",
          transactionHash: "tx_" + uuidv4(),
          priceAtTime: price
        });

        // ✅ Use global roundId
        const round = await GameRound.findOne({ roundId: activeRoundId });
        if (round) {
          round.bets.push({
            playerId,
            ...bet,
            cashoutMultiplier: currentMultiplier,
            cashedOut: true
          });
          await round.save();
        }

        delete activeBets[playerId];

        io.emit("player_cashout", {
          playerId,
          usd: cryptoAmount * price,
          crypto: cryptoAmount,
          multiplier: currentMultiplier
        });

      } catch (err) {
        socket.emit("error", err.message);
      }
    });
  });
}

module.exports = { startGame };
