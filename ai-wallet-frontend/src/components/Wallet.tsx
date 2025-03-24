import { useState } from 'react';

const Wallet = () => {
  const [address, setAddress] = useState<string>('');
  const [balance, setBalance] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ Отримання балансу
  const getBalance = async () => {
    setError(null);
    setBalance(null);
    try {
      const response = await fetch(`http://localhost:5000/balance/${address.trim()}`);
      const data = await response.json();
      if (response.ok) {
        setBalance(data.balance);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Помилка підключення до сервера');
    }
  };

  // ✅ Відправка транзакції
  const sendTransaction = async () => {
    setError(null);
    setTransactionHash(null);
    try {
      const response = await fetch('http://localhost:5000/sendTransaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: {
            to: address.trim(),
            amount: '0.01' // для тесту
          },
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setTransactionHash(data.txHash);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Помилка підключення до сервера');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>🔐 Wallet Interface</h2>

      {/* Введення адреси */}
      <input
        type="text"
        placeholder="Введіть адресу гаманця"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={{ padding: '10px', width: '80%', marginBottom: '10px' }}
      />

      {/* Кнопка для отримання балансу */}
      <div>
        <button onClick={getBalance} style={{ marginRight: '10px' }}>
          Отримати баланс
        </button>

        {/* Кнопка для відправки транзакції */}
        <button onClick={sendTransaction}>
          Відправити 0.01 ETH
        </button>
      </div>

      {/* Вивід балансу */}
      {balance !== null && (
        <p>💰 Баланс: {balance} ETH</p>
      )}

      {/* Вивід хеша транзакції */}
      {transactionHash && (
        <p>✅ Транзакція відправлена: {transactionHash}</p>
      )}

      {/* Вивід помилок */}
      {error && (
        <p style={{ color: 'red' }}>❌ {error}</p>
      )}
    </div>
  );
};

export default Wallet;
