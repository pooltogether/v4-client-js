import { BigNumber } from 'ethers'

import { DrawResults, LEGACYDrawResults, LEGACYPrize, PrizeAwardable } from '../types'

export const formatDrawResultsFromLegacyDrawResults = (
  LEGACY_drawResult: LEGACYDrawResults | DrawResults
): DrawResults => {
  const _prizes: (PrizeAwardable | LEGACYPrize)[] = LEGACY_drawResult.prizes
  const prizes: PrizeAwardable[] = _prizes.map((prize) => ({
    amount: BigNumber.from(prize.amount),
    tierIndex: 'distributionIndex' in prize ? prize.distributionIndex : prize.tierIndex,
    pick: BigNumber.from(prize.pick)
  }))
  const drawResults: DrawResults = {
    drawId: LEGACY_drawResult.drawId,
    totalValue: LEGACY_drawResult.totalValue,
    prizes
  }

  return drawResults
}
