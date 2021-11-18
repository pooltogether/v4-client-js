import { Interface } from "@ethersproject/abi";
import { Contract } from "@ethersproject/contracts";
import { Provider } from "@ethersproject/abstract-provider";
import { Signer } from "@ethersproject/abstract-signer";
import { Wallet } from "@ethersproject/wallet";

export const createContract = (
  address?: string,
  contractInterface?: Interface,
  provider?: Provider | Signer | Wallet
): Contract | undefined => {
  if (!address || !contractInterface) return undefined;
  return new Contract(address, contractInterface, provider);
};

export default createContract;
