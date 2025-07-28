// services/crashAlgo.js
const crypto = require("crypto");

// Provably fair crash algorithm
function generateCrashPoint(seed, roundNumber) {
  const input = seed + roundNumber;
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  const intVal = parseInt(hash.substring(0, 8), 16); // Use first 8 hex chars
  const maxCrash = 120; // max multiplier

  const crashPoint = 1 + (intVal % (maxCrash * 100)) / 100; // 1.00x - 120.00x
  return parseFloat(crashPoint.toFixed(2));
}

module.exports = { generateCrashPoint };
