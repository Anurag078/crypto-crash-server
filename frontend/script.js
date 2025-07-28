// const socket = io("http://localhost:5000");
const socket = io("https://crypto-crash-game-yuar.onrender.com");


let playerId = null;

function log(msg) {
  const logDiv = document.getElementById("log");
  logDiv.innerHTML = `<div>> ${msg}</div>` + logDiv.innerHTML;
}

// Multiplier updates
socket.on("multiplier_update", (data) => {
  document.getElementById("multiplier").innerText = `🚀 ${data.multiplier}x`;
});

socket.on("round_start", (data) => {
  document.getElementById("crash-point").innerText = `Next crash point: ???`;
  log(`🎲 New round started. Be ready!`);
});

socket.on("round_crash", (data) => {
  document.getElementById("crash-point").innerText = `💥 Crashed at: ${data.crashPoint}x`;
  log(`💀 Game crashed at ${data.crashPoint}x`);
});

socket.on("bet_accepted", (data) => {
  log(`✅ Bet placed: ${data.usdAmount} USD → ${data.cryptoAmount.toFixed(6)} ${data.currency}`);
  fetchWallet();
});

socket.on("player_cashout", (data) => {
  log(`💰 Cashout! ${data.crypto.toFixed(6)} at ${data.multiplier}x`);
  fetchWallet();
});

socket.on("error", (msg) => {
  log(`❌ ERROR: ${msg}`);
});

// Place Bet
function placeBet() {
  const username = document.getElementById("username").value.trim();
  const usdAmount = parseFloat(document.getElementById("usd-amount").value);
  const currency = document.getElementById("currency").value;

  if (!username || usdAmount <= 0) {
    alert("Enter valid username and amount.");
    return;
  }

  fetch(`/api/player-id?username=${username}`)
    .then((res) => res.json())
    .then((data) => {
      playerId = data.playerId;
      socket.emit("place_bet", { username, usdAmount, currency });
    });
}

// Cash Out
function cashOut() {
  if (!playerId) {
    alert("No player ID yet. Place a bet first.");
    return;
  }
  socket.emit("cashout", { playerId });
}

// Fetch wallet balance
function fetchWallet() {
  const username = document.getElementById("username").value.trim();
  if (!username) return;
  fetch(`/wallet/${username}`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("btc-balance").innerText = data.wallet.BTC.toFixed(6);
      document.getElementById("eth-balance").innerText = data.wallet.ETH.toFixed(6);
    });
}
