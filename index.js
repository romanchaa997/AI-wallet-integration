import express from 'express';
import cors from 'cors';
import { sendTransaction, provider } from './utils/ethTransaction.js';
import { ethers } from 'ethers';
import { PORT, corsOptions } from './config.js';

const app = express();

// 🔹 Додаємо CORS і JSON middleware
app.use(cors(corsOptions));
app.use(express.json());

// 🔹 Логування запитів
app.use((req, res, next) => {
    console.log(`📌 [${req.method}] ${req.url}`);
    next();
});

// ✅ Маршрут для відправки транзакції
app.post('/sendTransaction', async (req, res) => {
    try {
        console.log("🚀 Обробка /sendTransaction");

        const { to, amount, message } = req.body;

        if (!to || !amount) {
            return res.status(400).json({ error: 'Missing required parameters (to, amount)' });
        }
        if (!ethers.utils.isAddress(to)) {
            return res.status(400).json({ error: `Invalid Ethereum address: ${to}` });
        }

        const txHash = await sendTransaction({ to, amount, message });

        res.json({ success: true, txHash });
    } catch (error) {
        console.error("❌ Помилка відправки транзакції:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Маршрут перевірки статусу транзакції
app.get('/transaction-status/:txHash', async (req, res) => {
    try {
        const { txHash } = req.params;
        console.log(`🔍 Перевірка статусу: ${txHash}`);

        if (!txHash || txHash.length !== 66 || !txHash.startsWith('0x')) {
            return res.status(400).json({ error: `Invalid transaction hash format: ${txHash}` });
        }

        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt) {
            return res.json({ status: 'pending' });
        }

        res.json({
            status: receipt.status === 1 ? 'success' : 'failed',
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            from: receipt.from,
            to: receipt.to,
            hash: receipt.transactionHash
        });
    } catch (error) {
        console.error('❌ Помилка перевірки статусу транзакції:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ✅ Маршрут перевірки балансу
app.get('/balance/:address', async (req, res) => {
    try {
        const { address } = req.params;
        console.log(`💰 Перевірка балансу: ${address}`);

        if (!ethers.utils.isAddress(address)) {
            return res.status(400).json({ error: `Invalid Ethereum address: ${address}` });
        }

        const balance = await provider.getBalance(address);
        res.json({ balance: ethers.utils.formatEther(balance) });
    } catch (error) {
        console.error('❌ Помилка перевірки балансу:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 🔹 Централізований обробник помилок
app.use((err, req, res, next) => {
    console.error('❌ Внутрішня помилка сервера:', err.message);
    res.status(500).json({ error: err.message });
});

// 🔹 Перевірка недійсних маршрутів
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ✅ Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
});
