const express = require('express');
const cors = require('cors');
const { ethers } = require("ethers");

const app = express();
const port = 5000;

// ✅ Підключення до Ganache через порт 7545
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");

provider.getBlockNumber().then((blockNumber) => {
    console.log(`✅ Поточний блок: ${blockNumber}`);
  }).catch((error) => {
    console.error(`❌ Помилка отримання блоку: ${error.message}`);
  });
  
// ✅ Підключення до RPC
async function connectToRPC() {
  try {
    const network = await provider.getNetwork();
    console.log(`✅ Підключено до мережі: ${network.name} (chainId: ${network.chainId})`);
  } catch (error) {
    console.error(`❌ Не вдалося підключитися до RPC: ${error.message}`);
    if (error.code === "SERVER_ERROR") {
      console.error("🚨 Можливо, Ganache не запущений або порт заблокований");
    }
  }
}

connectToRPC();

app.use(express.json());
app.use(cors());

// 👉 Список балансів для тестування (локальний гаманець)
let balances = {
  '0x50B077A1570Fd981Fa4fC86cE62a3a7585F03244': ethers.parseEther("53.8975")
};

let transactions = {}; // Для збереження статусів транзакцій
console.log('👉 Content-Type:', req.headers['content-type']);

// ✅ Отримання балансу (ETH)
app.get('/balance/:address', async (req, res) => {
  const { address } = req.params;

  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: '❌ Некоректна адреса' });
  }

  try {
    const balance = await provider.getBalance(address);
    res.json({ balance: ethers.formatEther(balance) });
  } catch (error) {
    console.error('❌ Помилка отримання балансу:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Отримання балансу токенів (ERC-20)
app.get('/token-balance/:tokenAddress/:walletAddress', async (req, res) => {
  const { tokenAddress, walletAddress } = req.params;

  if (!ethers.isAddress(tokenAddress) || !ethers.isAddress(walletAddress)) {
    return res.status(400).json({ error: '❌ Некоректна адреса токена або гаманця' });
  }

  try {
    console.log(`👉 Запит балансу токенів для адреси: ${walletAddress}`);

    // ABI для роботи з контрактами ERC-20
    const abi = [
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)'
    ];

    const contract = new ethers.Contract(tokenAddress, abi, provider);
    const balance = await contract.balanceOf(walletAddress);
    const decimals = await contract.decimals();
    const symbol = await contract.symbol();

    const formattedBalance = ethers.formatUnits(balance, decimals);

    console.log(`✅ Баланс токенів ${symbol}: ${formattedBalance}`);
    res.json({ balance: parseFloat(formattedBalance).toFixed(4), symbol });
  } catch (error) {
    console.error('❌ Помилка отримання балансу токенів:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Відправка транзакції
app.post('/sendTransaction', async (req, res) => {
  const { to, amount } = req.body;

  if (!to || !amount) {
    return res.status(400).json({ error: '❌ Відсутні обов’язкові параметри' });
  }

  if (!ethers.isAddress(to)) {
    return res.status(400).json({ error: '❌ Некоректна адреса отримувача' });
  }

  try {
    const signer = provider.getSigner();

    // Створення транзакції
    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amount)
    });

    console.log(`✅ Транзакція відправлена: ${tx.hash}`);
    transactions[tx.hash] = 'pending';

    // Емулюємо завершення транзакції через 5 секунд
    setTimeout(async () => {
      const receipt = await provider.getTransactionReceipt(tx.hash);
      if (receipt && receipt.status === 1) {
        transactions[tx.hash] = 'success';
      } else {
        transactions[tx.hash] = 'failed';
      }
      console.log(`✅ Статус транзакції: ${transactions[tx.hash]}`);
    }, 5000);

    res.json({ txHash: tx.hash });
  } catch (error) {
    console.error('❌ Помилка відправлення транзакції:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ✅ Перевірка статусу транзакції
app.get('/transaction-status/:txHash', async (req, res) => {
  const { txHash } = req.params;

  if (!txHash) {
    return res.status(400).json({ error: '❌ Відсутній хеш транзакції' });
  }

  if (transactions[txHash]) {
    res.json({ status: transactions[txHash] });
  } else {
    res.json({ status: 'pending' });
  }
});

// ✅ Обробка невідомих маршрутів
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не знайдено' });
});

// ✅ Запуск сервера
app.listen(port, () => {
  console.log(`🚀 Сервер запущено на http://localhost:${port}`);
});
