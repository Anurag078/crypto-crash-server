const mongoose = require("mongoose");
require("dotenv").config();
const Player = require("../models/Player");

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await Player.deleteMany();

  await Player.create([
    {
      username: "anurag",
      wallet: {
        BTC: 0.01,
        ETH: 0.5
      }
    },
    {
      username: "saurav",
      wallet: {
        BTC: 0.005,
        ETH: 0.2
      }
    }
  ]);

  console.log("✅ Seed data inserted!");
  process.exit();
};

seed();
