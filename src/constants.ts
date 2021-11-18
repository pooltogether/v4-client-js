export const DAYS_IN_SECONDS = 86400;

export const HOUR_IN_SECONDS = 3600;

export const TIER_DENOMINATION = 9;

export enum ContractType {
  YieldSourcePrizePool = 'YieldSourcePrizePool',
  Ticket = 'Ticket',
  Token = 'Token',
  PrizeDistributor = 'PrizeDistributor',
  DrawBuffer = 'DrawBuffer',
  DrawBeacon = 'DrawBeacon',
  DrawCalculator = 'DrawCalculator',
  DrawCalculatorTimelock = 'DrawCalculatorTimelock',
  PrizeDistributionBuffer = 'PrizeDistributionBuffer'
  // ... more contract types
}
