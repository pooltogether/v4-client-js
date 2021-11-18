import { providers } from "ethers";
import { ContractList } from "@pooltogether/contract-list-schema";
import { Contract } from "@ethersproject/contracts";
import { createContract, createInterface } from "./utils";
import { Providers } from "./types";
import { Provider } from "@ethersproject/abstract-provider";
import { InfuraProvider } from "@ethersproject/providers";
import { getAddress } from "@ethersproject/address";
const debug = require("debug")("v4-js-core");
export interface PoolTogetherV4Config {
  infuraApiKey?: string;
}

export class PoolTogetherV4 {
  static instance: any;
  isInitialized: boolean | undefined;
  providers: Providers | undefined;
  contractList: ContractList | undefined;
  config: PoolTogetherV4Config | undefined;

  constructor(
    providers?: Providers,
    contractList?: ContractList,
    config?: PoolTogetherV4Config
  ) {
    if (!!PoolTogetherV4.instance) {
      return PoolTogetherV4.instance;
    }

    PoolTogetherV4.instance = this;
    this.providers = providers;
    this.contractList = contractList;
    this.config = config;
    // TODO: add conditional to check if providers and contractList is valid.
    this.isInitialized = true;
    return this;
  }

  setProviders(providers: Providers) {
    this.providers = providers;
  }

  setContractList(contractList: ContractList) {
    this.contractList = contractList;
  }

  setConfiguration(config: PoolTogetherV4Config) {
    this.config = config;
  }

  getInfuraProvider(chainId: number): InfuraProvider | undefined {
    return !this.config || !this.config.infuraApiKey
      ? undefined
      : new providers.InfuraProvider(chainId, this.config.infuraApiKey);
  }

  getProvider(chainId: number): Provider | undefined {
    return !this.providers ? undefined : this.providers[chainId];
  }

  getProviders(chainIds: number[]) {
    return chainIds.map((chainId: number) => {
      return this.getProvider(chainId);
    });
  }

  getProviderList(): Providers | undefined {
    return this.providers;
  }

  getContract(address: string): Contract | undefined {
    if (!this.contractList) return undefined;
    const contract = this.contractList.contracts.find(
      (contract: any) => getAddress(contract.address) === getAddress(address)
    );
    if (!contract) return undefined;
    debug("PoolTogetherV4:getContract", contract);
    return createContract(
      contract.address,
      createInterface(contract.abi),
      this.getProvider(contract.chainId)
    );
  }

  getContracts(addressList: string[]): Contract[] | undefined {
    if (!addressList && !Array.isArray(addressList)) return undefined;
    return addressList.map((address: string): any => {
      return this.getContract(address);
    });
  }

  getContractList() {
    return this.contractList;
  }
}

export default PoolTogetherV4;
