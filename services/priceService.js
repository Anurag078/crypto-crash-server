const axios = require("axios");

let cachedPrices = null;
let lastFetched = 0;
const CACHE_DURATION = 10000; // 10 seconds

const getPrices = async () => {
  const now = Date.now();
  if (cachedPrices && now - lastFetched < CACHE_DURATION) {
    return cachedPrices;
  }

  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
    );

    cachedPrices = {
      BTC: response.data.bitcoin.usd,
      ETH: response.data.ethereum.usd
    };
    lastFetched = now;
    return cachedPrices;
  } catch (error) {
    console.error("❌ Error fetching crypto prices:", error.message);
    if (cachedPrices) {
      return cachedPrices; // fallback to last known prices
    }
    throw new Error("Failed to fetch crypto prices and no cached data available.");
  }
};

module.exports = { getPrices };
