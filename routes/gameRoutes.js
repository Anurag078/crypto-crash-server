const express = require("express");
const router = express.Router();

// You can expand this later with more game logic if needed
router.get("/", (req, res) => {
  res.send("🎮 Game route is working!");
});

module.exports = router;
