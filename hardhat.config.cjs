/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: "0.8.28", // Вкажи актуальну версію Solidity
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", // Ganache або Anvil
    },
  },
};
