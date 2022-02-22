import { utils as V4Utils } from '@pooltogether/v4-utils-js'
import { BigNumber } from 'ethers'

import { DrawResults, Prize, PrizeAwardable } from '../types'
import { sumBigNumbers } from './sumBigNumbers'

export const formatDrawResultsFromPrizes = (
  drawId: number,
  _allPrizes: Prize[],
  maxPicksPerUser: number
): DrawResults => {
  const prizes: PrizeAwardable[] = _allPrizes.map((prize) => ({
    amount: BigNumber.from(prize.amount),
    tierIndex: prize.tier,
    pick: BigNumber.from(prize.pick)
  }))
  const totalValue = sumBigNumbers(prizes.map((prize) => prize.amount))
  const drawResults = V4Utils.filterResultsByValue(
    {
      drawId,
      totalValue,
      prizes
    } as DrawResults,
    maxPicksPerUser
  )

  return drawResults
}
