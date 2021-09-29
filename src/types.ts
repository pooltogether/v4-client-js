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

// Modelled after the generated types

export interface Draw {
  drawId: number
  timestamp: number
  winningRandomNumber: BigNumber
}

export interface PrizeDistributions {
  bitRangeSize: number
  matchCardinality: number
  drawStartTimestampOffset: number
  drawEndTimestampOffset: number
  maxPicksPerUser: number
  numberOfPicks: BigNumber
  distributions: number[]
  prize: BigNumber
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
  PrizeDistribution as DrawCalcPrizeDistributions,
  Draw as DrawCalcDraw,
  Pick as DrawCalcPick,
  User as DrawCalcUser,
  DrawResults,
  PrizeAwardable,
  PickPrize,
  Claim,
  UserDrawResult as DrawCalcUserDrawResult
} from '@pooltogether/draw-calculator-js'
