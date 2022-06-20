export const DAYS_IN_SECONDS = 86400

export const HOUR_IN_SECONDS = 3600

export const TIER_DENOMINATION = 9

export const VERSION_1 = { major: 1, minor: 0, patch: 0 }

/**
 * A shortlist of PoolTogether v4 contract names that are used by the classes in this repo.
 */
export enum ContractType {
  PrizePool = 'PrizePool',
  Ticket = 'Ticket',
  Token = 'Token',
  PrizeDistributor = 'PrizeDistributor',
  DrawBuffer = 'DrawBuffer',
  PrizeDistributionBuffer = 'PrizeDistributionBuffer',
  DrawBeacon = 'DrawBeacon',
  DrawCalculator = 'DrawCalculator',
  PrizeConfigHistory = 'PrizeConfigHistory',
  GaugeController = 'GaugeController',
  GaugeReward = 'GaugeReward',
  Liquidator = 'Liquidator',
  DrawCalculatorTimelock = 'DrawCalculatorTimelock'
  // ... more contract types
}

export enum PrizeApiStatus {
  loading = 'LOADING',
  success = 'SUCCESS',
  failure = 'FAILURE'
}
