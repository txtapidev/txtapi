require('dotenv').config();
const express = require('express');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3000;

const RPC_URL = process.env.ALCHEMY_RPC_URL; // Ej: 'https://polygon-mainnet.g.alchemy.com/v2/TU_KEY'
const TOKEN_ADDRESS = '0x85931ad37af0a3bb892086d13030330e93eac9df';
//const EXCLUDED_WALLETS = ['0x0aea9204efdeade81d061ebf25cbdecbdecb042da8e5']; // Vesting contract
const EXCLUDED_WALLETS = ['0x0aea9204efdeade81d061ebf25cbdecb042da8e5']; // Añade más direcciones si es necesario

const provider = new ethers.JsonRpcProvider(RPC_URL);

const ERC20_ABI = [
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)"
];

const tokenContract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

async function getDecimals() {
  return await tokenContract.decimals();
}

async function getTotalSupply() {
  const total = await tokenContract.totalSupply();
  const decimals = await tokenContract.decimals();
  
  // Convierte a BigInt y divide por 10^decimals, luego a string sin decimales
  const supply = total / (10n ** BigInt(decimals));
  return supply.toString(); // Devuelve '200000000' exactamente
}

async function getBalance(address) {
  const balance = await tokenContract.balanceOf(address);
  const decimals = await getDecimals();
  return parseFloat(ethers.formatUnits(balance, decimals));
}

async function getCirculatingSupply() {
  const total = parseFloat(await getTotalSupply());
  let excluded = 0;
  for (const wallet of EXCLUDED_WALLETS) {
    excluded += await getBalance(wallet);
  }
  return Math.floor(total - excluded).toString(); // Ej: '96749999'
}

async function getMaxSupply() {
  return '200000000';
}

// Endpoints (devuelven solo el número)
app.get('/api/total-supply', async (req, res) => {
  res.type('text/plain').send(await getTotalSupply());
});

app.get('/api/circulating-supply', async (req, res) => {
  res.type('text/plain').send(await getCirculatingSupply());
});

app.get('/api/max-supply', async (req, res) => {
  res.type('text/plain').send(await getMaxSupply());
});

app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});