import { useState, useEffect } from 'react';
import { ethers } from 'ethers';


function App() {
  const [balance, setBalance] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [txHash, setTxHash] = useState('');
  const [txStatus, setTxStatus] = useState('');

  // ✅ Валідація адреси
  const isValidAddress = (address: string) => {
    try {
      return ethers.utils.getAddress(address.trim());
    } catch {
      return false;
    }
  };

  // ✅ Обробка помилок в одному місці
  const handleError = (error: any) => {
    if (error.message.includes('insufficient funds')) {
      setStatus('❌ Недостатньо коштів');
    } else if (error.message.includes('network error')) {
      setStatus('❌ Проблема з мережею');
    } else {
      console.error('❌ Сталася помилка:', error);
      setStatus(`❌ Помилка: ${error.message}`);
    }
  };
  

  // ✅ Перевірка балансу
  const getBalance = async () => {
    if (!toAddress) {
      setStatus('❌ Введіть адресу');
      return;
    }

    const validatedAddress = isValidAddress(toAddress);
    if (!validatedAddress) {
      setStatus('❌ Невірний формат адреси');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/balance/${validatedAddress}`
      );

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setBalance(parseFloat(data.balance).toFixed(4));
      setStatus(`✅ Баланс отримано: ${parseFloat(data.balance).toFixed(4)} ETH`);
    } catch (error: any) {
      handleError(error);
    }
  };

  // ✅ Відправка транзакції
  const sendTransaction = async () => {
    if (!toAddress || !amount) {
      setStatus('❌ Введіть адресу та суму');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/sendTransaction`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: toAddress.trim(),
            amount: amount.trim(),
            message: message.trim(),
          }),
        }
      );

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      if (data.hash) {
        setTxHash(data.hash);
        setStatus(`✅ Транзакція відправлена: ${data.hash}`);
        checkTransactionStatus(data.hash); // ✅ Додаємо перевірку статусу транзакції
      } else {
        setStatus(`❌ Помилка: ${data.error}`);
      }
    } catch (error: any) {
      handleError(error);
    }
  };

  // ✅ Логіка для оновлення статусу транзакції
  const checkTransactionStatus = async (hash: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/transaction-status/${hash}`);
      const data = await response.json();
  
      if (data.status === 'success' || data.status === 'failed') {
        setTxStatus(data.status);
        setStatus(`✅ Статус: ${data.status}`);
        
        // Оновлення балансу після підтвердження транзакції
        const balanceResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/balance/${toAddress}`);
        const balanceData = await balanceResponse.json();
        setBalance(parseFloat(balanceData.balance).toFixed(4));
      } else {
        setTimeout(() => checkTransactionStatus(hash), 3000);
      }
    } catch (error) {
      console.error("❌ Помилка перевірки статусу:", error);
    }
  };
  

  // ✅ Постійна перевірка статусу транзакції
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (txHash) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/transaction-status/${txHash}`
          );
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

          const data = await response.json();
          setTxStatus(data.status);

          if (data.status === 'success' || data.status === 'failed') {
            clearInterval(intervalId);
            await getBalance(); // Оновлюємо баланс після завершення транзакції
          }
        } catch (error) {
          console.error('❌ Помилка перевірки статусу транзакції:', error);
          clearInterval(intervalId);
        }
      }, 5000);
    }

    return () => clearInterval(intervalId);
  }, [txHash]);

  return (
    <div className="app">
      <div className="form">
        <button onClick={getBalance}>Get Balance</button>
        {balance && <p>Balance: {balance} ETH</p>}

        <input
          type="text"
          placeholder="Address"
          value={toAddress}
          onChange={(e) => setToAddress(e.target.value)}
        />
        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <button onClick={sendTransaction}>Send Transaction</button>

        {/* ✅ Відображаємо статус */}
        {status && (
        <div className={`status ${txStatus}`}>
          {status}
        </div>
        )}


        {/* ✅ Відображаємо хеш транзакції */}
        {txHash && (
          <p>
            Transaction Hash: {txHash}{' '}
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              🔗 Переглянути на Etherscan
            </a>
          </p>
        )}

        {/* ✅ Відображаємо статус підтвердження */}
        {txStatus && (
          <p>
            Status: {txStatus === 'success' ? '✅ Підтверджено' : '❌ Не підтверджено'}
          </p>
        )}
      </div>
    </div>
  );
}

export default App;
