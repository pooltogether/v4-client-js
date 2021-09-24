import { Provider } from '@ethersproject/abstract-provider'
import { BigNumber } from 'ethers'

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
  [networkId: number]: Provider
}

export interface ChildContractAddresses {
  [chainId: number]: {
    [contractAddress: string]: {
      [childContractType: string]: string
    }
  }
}

// Forward other PoolTogether types
export {
  TsunamiDrawSettings,
  Draw,
  Pick,
  User,
  DrawResults,
  PrizeAwardable,
  PickPrize,
  Claim,
  UserDrawResult
} from '@pooltogether/draw-calculator-js'

export {
  Version,
  Tags,
  ABIIdentifier,
  ContractIdentifier,
  Contract,
  ContractList
} from '@pooltogether/contract-list-schema'
