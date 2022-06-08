import { Contract } from '../types'

/**
 * Searches through a contract list to find a particular contract keyed by chain id and address
 * @param contractList
 * @param chainId
 * @param address
 * @returns
 */
export const findInContractList = (
  contracts: Contract[],
  chainId: number,
  address: string
): Contract | undefined => {
  return contracts.find(
    (contract: Contract) => contract.chainId === chainId && contract.address === address
  )
}
