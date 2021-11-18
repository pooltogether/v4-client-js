export const INFURA_ID = "b81e24d29d1942b8bf04bf3c81ae3761";

export const NETWORK_CHAIN_ID = parseInt(
  process.env.DEFAULT_CHAIN_ID ?? "1",
  10
);

export const NETWORK_URL_MAINNET =
  process.env.NETWORK_URL_MAINNET ||
  `https://mainnet.infura.io/v3/${INFURA_ID}`;

export const NETWORK_URL_RINKEBY =
  process.env.NETWORK_URL_RINKEBY ||
  `https://rinkeby.infura.io/v3/${INFURA_ID}`;

export const NETWORK_URL_KOVAN =
  process.env.NETWORK_URL_KOVAN || `https://kovan.infura.io/v3/${INFURA_ID}`;

export const NETWORK_URL_GOERLI =
  process.env.NETWORK_URL_GOERLI || `https://goerli.infura.io/v3/${INFURA_ID}`;

export const NETWORK_URL_POLYGON_MAINNET =
  process.env.NETWORK_URL_POLYGON_MAINNET ||
  `https://polygon-mainnet.infura.io/v3/${INFURA_ID}`;

export const NETWORK_URL_POLYGON_MUMBAI =
  process.env.NETWORK_URL_POLYGON_MUMBAI || "https://rpc-mumbai.maticvigil.com";

export const NETWORK_URL_BINANCE_MAINNET =
  process.env.NETWORK_URL_BINANCE_MAINNET ||
  "https://bsc-dataseed1.binance.org";

export const NETWORK_URL_HARDHAT =
  process.env.NETWORK_URL_HARDHAT || "http://127.0.0.1:8545";
