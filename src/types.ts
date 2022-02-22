import { Provider } from '@ethersproject/abstract-provider'
import { BigNumber, Signer } from 'ethers'

export {
  Version,
  Tags,
  ABIIdentifier,
  ContractIdentifier,
  Contract,
  ContractList
} from '@pooltogether/contract-list-schema'

export {
  Draw,
  PrizeTier,
  PrizeDistribution,
  Pick,
  DrawResults,
  PrizeAwardable,
  PickPrize,
  Claim,
  Prize
} from '@pooltogether/v4-utils-js'

export interface TokenData {
  name: string
  symbol: string
  decimals: string
}

export interface PrizePoolTokenBalances {
  ticket: BigNumber
  token: BigNumber
}

export interface Providers {
  [chainId: number]: Provider
}

export interface SignersOrProviders {
  [chainId: number]: Provider | Signer
}

export interface LEGACY_DrawResults {
  drawId: number
  totalValue: BigNumber
  prizes: LEGACY_Prize[]
}

export interface LEGACY_Prize {
  amount: BigNumber
  distributionIndex: number
  pick: BigNumber
}

export interface ChildContractAddresses {
  [chainId: number]: {
    [contractAddress: string]: {
      [childContractType: string]: string
    }
  }
}
