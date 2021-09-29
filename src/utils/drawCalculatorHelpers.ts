import { BigNumber } from 'ethers'
import { formatUnits, parseUnits } from '@ethersproject/units'
import { PrizeDistributions, DrawCalcPrizeDistributions, Draw, DrawCalcDraw } from '../types'
import { calculatePrizeForDistributionIndex as _calculatePrizeForDistributionIndex } from '@pooltogether/draw-calculator-js'

const DECIMALS_FOR_DISTRIBUTIONS = 9

export const toDrawCalcPrizeDistributions = (
  prizeDistributions: PrizeDistributions
): DrawCalcPrizeDistributions => ({
  ...prizeDistributions,
  numberOfPicks: prizeDistributions.numberOfPicks.toNumber(),
  distributions: prizeDistributions.distributions.map((d) => toDistributionBigNumber(String(d)))
})

export const toDistributionNumber = (distributionUnformatted: BigNumber) =>
  Number(formatUnits(distributionUnformatted, DECIMALS_FOR_DISTRIBUTIONS))

export const toDistributionBigNumber = (distribution: string) =>
  parseUnits(distribution, DECIMALS_FOR_DISTRIBUTIONS)

export const toDrawCalcDraw = (draw: Draw): DrawCalcDraw => ({
  ...draw,
  drawId: BigNumber.from(draw.drawId)
})

export const calculatePrizeForDistributionIndex = (
  prizeDistributionIndex: number,
  prizeDistributions: PrizeDistributions,
  draw: Draw
) =>
  _calculatePrizeForDistributionIndex(
    prizeDistributionIndex,
    toDrawCalcPrizeDistributions(prizeDistributions),
    toDrawCalcDraw(draw)
  )
