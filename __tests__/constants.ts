import { BigNumber } from '@ethersproject/bignumber'
import { keccak256 } from '@ethersproject/keccak256'
import { toUtf8Bytes } from '@ethersproject/strings'
import { parseUnits } from '@ethersproject/units'

import { formatTierToBasePercentage } from '../src/utils/formatTierToBasePercentage'

export const CHAIN_ID = 1
export const READ_PROVIDER = ''
export const ADDRESS_DEAD = '0x000000000000000000000000000000000000dEaD'
export const BYTES32_ADDRESS_DEAD = keccak256(toUtf8Bytes(ADDRESS_DEAD))
export const PRIZE_EXAMPLE_ONE = parseUnits('5000', 18)
export const NUMBER_OF_PICKS_EXAMPLE_ONE = BigNumber.from('1000')

export const TIERS_EXAMPLE_ONE = [
  formatTierToBasePercentage('0.25'),
  formatTierToBasePercentage('0.05'),
  formatTierToBasePercentage('0.5'),
  formatTierToBasePercentage('0.2'),
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
]

export const TIERS_EXAMPLE_EMPTY = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

export const TIERS_EXAMPLE_INVALID = [
  formatTierToBasePercentage('500000000'),
  formatTierToBasePercentage('500000000'),
  formatTierToBasePercentage('500000000'),
  formatTierToBasePercentage('500000000'),
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
]

export const DRAW_EXAMPLE_ONE = {
  winningRandomNumber: BigNumber.from(
    '21288413488180966377126236036201345909019919575750940621513526137694302720820'
  ),
  drawId: 1,
  timestamp: 1634410924,
  beaconPeriodStartedAt: 1634324400,
  beaconPeriodSeconds: 86400
}

export const PRIZE_DISTRIBUTION_EXAMPLE_ONE = {
  bitRangeSize: 2,
  matchCardinality: 10,
  tiers: TIERS_EXAMPLE_ONE,
  maxPicksPerUser: 2,
  expiryDuration: 5184000,
  numberOfPicks: NUMBER_OF_PICKS_EXAMPLE_ONE,
  startTimestampOffset: 86400,
  prize: PRIZE_EXAMPLE_ONE,
  endTimestampOffset: 900
}

export const PRIZE_DISTRIBUTION_EXAMPLE_VALID = {
  bitRangeSize: 2,
  matchCardinality: 10,
  tiers: TIERS_EXAMPLE_ONE,
  maxPicksPerUser: 2,
  expiryDuration: 5184000,
  numberOfPicks: NUMBER_OF_PICKS_EXAMPLE_ONE,
  startTimestampOffset: 86400,
  prize: PRIZE_EXAMPLE_ONE,
  endTimestampOffset: 900
}

export const PRIZE_DISTRIBUTION_EXAMPLE_INVALID = {
  bitRangeSize: 0,
  matchCardinality: 50,
  tiers: TIERS_EXAMPLE_EMPTY,
  maxPicksPerUser: 0,
  expiryDuration: 0,
  numberOfPicks: BigNumber.from('0'),
  startTimestampOffset: 0,
  prize: BigNumber.from('0'),
  endTimestampOffset: 0
}

export const contactList = {
  name: 'Mainnet ContractList',
  version: { major: 1, minor: 0, patch: 0 },
  tags: {},
  contracts: [
    {
      chainId: 1,
      address: '0x000000000000000000000000000000000000dEaD',
      version: { major: 1, minor: 0, patch: 0 },
      type: 'ContractName',
      abi: []
    }
  ]
}
