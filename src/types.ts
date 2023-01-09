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
  PrizeTierConfig,
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

export interface LEGACYDrawResults {
  drawId: number
  totalValue: BigNumber
  prizes: LEGACYPrize[]
}

export interface LEGACYPrize {
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

// NOTE: These are only required since the `eth-permit` package doesn't export all its types
export interface ERC2612PermitMessage {
  owner: string
  spender: string
  value: number | string
  nonce: number | string
  deadline: number | string
}
export interface EIP712Domain {
  name: string
  version: string
  chainId: number
  verifyingContract: string
}

export interface EIP2612SignatureTuple {
  deadline: number
  v: number
  r: string
  s: string
}

export interface ERC2612TicketPermitMessage {
  user: string
  delegate: string
  nonce: number | string
  deadline: number | string
}
