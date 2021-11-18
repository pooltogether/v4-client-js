import { JsonRpcProvider } from "@ethersproject/providers";
import getJsonRpcProvider from "./getJsonRpcProvider";

import {
  NETWORK_URL_MAINNET,
  NETWORK_URL_RINKEBY,
  NETWORK_URL_GOERLI,
  NETWORK_URL_POLYGON_MAINNET,
  NETWORK_URL_POLYGON_MUMBAI,
} from "../config/networks";

export function getProviderFromChainId(
  chainId: string | number
): JsonRpcProvider | undefined {
  switch (chainId) {
    case 1:
    case "1":
      return getJsonRpcProvider(NETWORK_URL_MAINNET);
    case 4:
    case "4":
      return getJsonRpcProvider(NETWORK_URL_RINKEBY);
    case 5:
    case "5":
      return getJsonRpcProvider(NETWORK_URL_GOERLI);
    case 137:
    case "137":
      return getJsonRpcProvider(NETWORK_URL_POLYGON_MAINNET);
    case 80001:
    case "80001":
      return getJsonRpcProvider(NETWORK_URL_POLYGON_MUMBAI);
    default:
      return undefined;
  }
}

export default getProviderFromChainId;
