import { filterResultsByValue } from '@pooltogether/draw-calculator-js'
import { BigNumber } from 'ethers'

import { DrawResults, Prize, PrizeAwardable } from '../types'
import { sumBigNumbers } from './sumBigNumbers'

export const prizesToDrawResults = (
  drawId: number,
  _allPrizes: Prize[],
  maxPicksPerUser: number
): DrawResults => {
  const prizes: PrizeAwardable[] = _allPrizes.map((prize) => ({
    amount: BigNumber.from(prize.amount),
    distributionIndex: prize.tier,
    pick: BigNumber.from(prize.pick)
  }))
  const totalValue = sumBigNumbers(prizes.map((prize) => prize.amount))
  const drawResults = filterResultsByValue(
    {
      drawId,
      totalValue,
      prizes
    } as DrawResults,
    maxPicksPerUser
  )

  return drawResults
}
