import { Provider } from '@ethersproject/abstract-provider'
import { BigNumber, Signer } from 'ethers'
import {
  Pick,
} from '@pooltogether/draw-calculator-js'

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
  [chainId: number]: Provider | undefined;
}

export interface SignersOrProviders {
  [chainId: number]: Provider | Signer
}

export interface ChildContractAddresses {
  [chainId: number]: {
    [contractAddress: string]: {
      [childContractType: string]: string
    }
  }
}

export interface User {
  address: string;
  normalizedBalances: BigNumber[];
  picks?: Pick[]; // optional as user may not have picks (under floor)
}

// Modelled after the generated types

export interface Draw {
  drawId: number
  timestamp: number
  winningRandomNumber: BigNumber
}

export {
  Version,
  Tags,
  ABIIdentifier,
  ContractIdentifier,
  Contract,
  ContractList
} from '@pooltogether/contract-list-schema'

// Forward other PoolTogether types
export {
  Draw as DrawCalcDraw,
  User as DrawCalcUser,
  UserDrawResult as DrawCalcUserDrawResult,
  PrizeDistribution,
  Pick,
  DrawResults,
  PrizeAwardable,
  PickPrize,
  Claim
} from '@pooltogether/draw-calculator-js'
