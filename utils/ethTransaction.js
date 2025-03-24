import { ethers } from "ethers";

// Правильний виклик для ethers@5.x
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

export const sendTransaction = async ({ to, amount, message }) => {
  try {
    console.log(`🔍 Надсилання транзакції до: ${to}, сума: ${amount} ETH`);

    // Отримуємо об'єкт signer для підписання транзакції
    const signer = provider.getSigner();

    // Створюємо транзакцію
    const tx = await signer.sendTransaction({
      to,
      value: ethers.utils.parseEther(amount), // Для ethers@5.x використовуємо ethers.utils.parseEther
      data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message || "")),
    });

    console.log(`✅ Транзакцію відправлено, хеш: ${tx.hash}`);
    console.log(`👉 Довжина хеша: ${tx.hash.length}`);

    if (tx.hash.length !== 66) {
      console.error(`❌ Невірний формат хеша (отримано ${tx.hash.length} символів): ${tx.hash}`);
      throw new Error(`Invalid hash length: ${tx.hash.length}`);
    }

    // Очікуємо підтвердження транзакції в мережі
    const receipt = await tx.wait();
    console.log(`✅ Транзакція підтверджена у блоці ${receipt.blockNumber}`);

    return tx.hash;
  } catch (error) {
    console.error('❌ Помилка надсилання транзакції:', error.message);
    throw new Error(`Transaction failed: ${error.message}`);
  }
};

// Перевірка статусу транзакції
export const getTransactionStatus = async (txHash) => {
  try {
    console.log(`🔍 Перевірка статусу транзакції: ${txHash}`);

    if (!txHash || txHash.length !== 66 || !txHash.startsWith('0x')) {
      throw new Error(`Invalid transaction hash format: ${txHash}`);
    }

    const receipt = await provider.getTransactionReceipt(txHash);

    if (receipt) {
      console.log(`✅ Статус транзакції: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        from: receipt.from,
        to: receipt.to,
        hash: receipt.transactionHash,
      };
    } else {
      console.log(`⌛ Транзакція ще обробляється...`);
      return { status: 'pending' };
    }
  } catch (error) {
    console.error(`❌ Помилка перевірки статусу транзакції: ${error.message}`);
    throw new Error(`Failed to fetch transaction status: ${error.message}`);
  }
};

export { provider };
