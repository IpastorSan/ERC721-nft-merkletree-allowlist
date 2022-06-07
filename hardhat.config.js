require("@nomiclabs/hardhat-waffle");
require('dotenv').config()
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");

module.exports = {
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    rinkeby: {
      url: process.env.DEVELOPMENT_ALCHEMY_KEY,
      accounts: [process.env.PRIVATE_KEY_DEVELOPMENT],
      gasMultiplier: 1.2,
    },

    mainnet:{
      url: process.env.PRODUCTION_ALCHEMY_KEY,
      accounts: [process.env.PRIVATE_KEY_PRODUCTION],
      gasMultiplier: 1.2,
    }
  },
  etherscan: {
        // Your API key for Etherscan
        // Obtain one at https://etherscan.io/
      apiKey: process.env.ETHERSCAN_KEY,
      },
  gasReporter: {
        coinmarketcap: process.env.GAS_REPORTER_KEY,
      }
    };

