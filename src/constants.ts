export const DAYS_IN_SECONDS = 86400

export const HOUR_IN_SECONDS = 3600

export const TIER_DENOMINATION = 9

/**
 * A shortlist of PoolTogether v4 contract names that are used by the classes in this repo.
 */
export enum ContractType {
  YieldSourcePrizePool = 'YieldSourcePrizePool',
  Ticket = 'Ticket',
  Token = 'Token',
  PrizeDistributor = 'PrizeDistributor',
  DrawBuffer = 'DrawBuffer',
  DrawBeacon = 'DrawBeacon',
  DrawCalculator = 'DrawCalculator',
  DrawCalculatorTimelock = 'DrawCalculatorTimelock',
  PrizeDistributionBuffer = 'PrizeDistributionBuffer',
  PrizeTierHistory = 'PrizeTierHistory'
  // ... more contract types
}

export enum PrizeApiStatus {
  loading = 'LOADING',
  success = 'SUCCESS',
  failure = 'FAILURE'
}
