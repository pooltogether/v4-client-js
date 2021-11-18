import {
  NETWORK_URL_GOERLI,
  NETWORK_URL_MAINNET,
  NETWORK_URL_RINKEBY,
} from "./networks";

export const ethereumMainnet = [
  {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    rpcUrls: [NETWORK_URL_MAINNET],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://etherscan.io/"],
  },
];

export const ethereumRinkeby = [
  {
    chainId: "0x4",
    chainName: "Ethereum Mainnet",
    rpcUrls: [NETWORK_URL_RINKEBY],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://rinkeby.etherscan.io/"],
  },
];

export const ethereumGoerli = [
  {
    chainId: "0x5",
    chainName: "Ethereum Goerli",
    rpcUrls: [NETWORK_URL_GOERLI],
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    blockExplorerUrls: ["https://goerli.etherscan.io/"],
  },
];

export const polygonMainnet = [
  {
    chainId: "0x89",
    chainName: "Polygon",
    rpcUrls: ["https://polygon-rpc.com/"],
    nativeCurrency: {
      name: "Matic Coin",
      symbol: "MATIC",
      decimals: 18,
    },
    blockExplorerUrls: ["https://polygonscan.com/"],
  },
];

export const polygonMumbai = [
  {
    chainId: "0x13881",
    chainName: "Polygon Testnet Mumbai",
    rpcUrls: ["https://rpc-mumbai.matic.today"],
    nativeCurrency: {
      name: "Matic Coin",
      symbol: "MATIC",
      decimals: 18,
    },
    blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
  },
];

export const binanceMainnet = [
  {
    chainId: "0X38",
    chainName: "Binance Smart Chain Mainnet",
    rpcUrls: ["https://bsc-dataseed1.binance.org"],
    nativeCurrency: {
      name: "Binance Coin",
      symbol: "BNB",
      decimals: 18,
    },
    blockExplorerUrls: ["https://bscscan.com/"],
  },
];

export const binanceTestnet = [
  {
    chainId: "0x61",
    chainName: "Binance Smart Chain Testnet",
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    nativeCurrency: {
      name: "Binance Coin",
      symbol: "tBNB",
      decimals: 18,
    },
    blockExplorerUrls: ["https://testnet.bscscan.com/"],
  },
];

const chainList = {
  ethereumMainnet,
  ethereumRinkeby,
  ethereumGoerli,
  polygonMainnet,
  polygonMumbai,
  binanceMainnet,
  binanceTestnet,
};

export default chainList;
