const express = require("express");
const router = express.Router();
const Player = require("../models/Player");

// ✅ Get wallet balance by username
router.get("/:username", async (req, res) => {
  try {
    const player = await Player.findOne({ username: req.params.username });
    if (!player) return res.status(404).json({ error: "Player not found" });

    res.json({ wallet: player.wallet });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
