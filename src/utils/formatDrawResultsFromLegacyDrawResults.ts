import { BigNumber } from 'ethers'

import { DrawResults, LEGACY_DrawResults, LEGACY_Prize, PrizeAwardable } from '../types'

export const formatDrawResultsFromLegacyDrawResults = (
  LEGACY_drawResult: LEGACY_DrawResults | DrawResults
): DrawResults => {
  const _prizes: (PrizeAwardable | LEGACY_Prize)[] = LEGACY_drawResult.prizes
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
