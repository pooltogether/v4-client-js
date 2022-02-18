import { BigNumber } from 'ethers'

export const createEmptyDrawResult = (drawId: number) => ({
  drawId,
  totalValue: BigNumber.from(0),
  prizes: []
})
