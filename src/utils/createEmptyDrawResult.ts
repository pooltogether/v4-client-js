import { DrawResults } from '@pooltogether/v4-utils-js'
import { BigNumber } from 'ethers'

export const createEmptyDrawResult = (drawId: number): DrawResults => ({
  drawId,
  totalValue: BigNumber.from(0),
  prizes: []
})
