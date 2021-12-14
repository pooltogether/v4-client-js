import { Provider } from '@ethersproject/abstract-provider'
import { BigNumber, Signer } from 'ethers'

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

export interface ChildContractAddresses {
  [chainId: number]: {
    [contractAddress: string]: {
      [childContractType: string]: string
    }
  }
}

// Modelled after the generated types

export interface Draw {
  drawId: number
  timestamp: BigNumber
  winningRandomNumber: BigNumber
  beaconPeriodStartedAt: BigNumber
  beaconPeriodSeconds: number
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
  PrizeTier,
  PrizeDistribution,
  Pick,
  DrawResults,
  PrizeAwardable,
  PickPrize,
  Claim
} from '@pooltogether/draw-calculator-js'
