import { Result } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { TokenData } from 'types'
import { BigNumber } from '@ethersproject/bignumber'

export async function getTokenData(tokenContract: Contract): Promise<TokenData> {
  const namePromise = tokenContract.functions.name() as Promise<Result>
  const symbolPromise = tokenContract.functions.symbol() as Promise<Result>
  const decimalsPromise = tokenContract.functions.decimals() as Promise<Result>
  const results = await Promise.all([namePromise, symbolPromise, decimalsPromise])
  return {
    name: results[0][0],
    symbol: results[1][0],
    decimals: results[2][0]
  }
}

export async function getUsersERC20Balance(
  usersAddress: string,
  tokenContract: Contract
): Promise<BigNumber> {
  const result: Result = await tokenContract.functions.balanceOf(usersAddress)
  return result[0]
}

export async function getUsersTokenAllowance(
  usersAddress: string,
  spendersAddress: string,
  tokenContract: Contract
): Promise<BigNumber> {
  const result: Result = await tokenContract.functions.allowance(usersAddress, spendersAddress)
  return result[0]
}
