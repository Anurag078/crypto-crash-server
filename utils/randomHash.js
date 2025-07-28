const crypto = require("crypto");

function generateRandomSeed() {
  return crypto.randomBytes(16).toString("hex");
}

function hashSeed(seed) {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

module.exports = {
  generateRandomSeed,
  hashSeed,
};
