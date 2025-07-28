const crypto = require("crypto");

/**
 * Generates a provably fair crash point from a seed and round number.
 * @param {string} seed - secret server seed
 * @param {number} round - round number
 * @returns {number} crashPoint - crash multiplier (e.g., 1.5x, 3x)
 */
function generateCrashPoint(seed, round) {
  const input = `${seed}-${round}`;
  const hash = crypto.createHash("sha256").update(input).digest("hex");

  const h = parseInt(hash.substring(0, 13), 16); // take first 13 hex chars
  const maxInt = Math.pow(2, 52); // large max value

  const crashPoint = Math.floor((100000 * maxInt) / (maxInt - h)) / 100000;

  // Max crash limit (e.g., 120x)
  return Math.min(crashPoint, 120);
}

module.exports = {
  generateCrashPoint,
};
