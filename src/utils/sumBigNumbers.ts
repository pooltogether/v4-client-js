import { BigNumber } from 'ethers'

export const sumBigNumbers = (values: BigNumber[]) =>
  values.reduce((sum, value) => sum.add(value), BigNumber.from(0))
