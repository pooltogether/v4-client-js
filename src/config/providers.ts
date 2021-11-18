import { getProviderFromChainId } from "../utils/getProviderFromChainId";

export const providersMainnet = {
  1: getProviderFromChainId(1),
  137: getProviderFromChainId(137),
};

export const providersTestnet = {
  4: getProviderFromChainId(4),
  80001: getProviderFromChainId(80001),
};

export const providersAll = {
  ...providersMainnet,
  ...providersTestnet,
};

export default {
  all: providersAll,
  mainnet: providersMainnet,
  testnet: providersTestnet,
};
