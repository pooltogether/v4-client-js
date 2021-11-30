import { Contract, ContractList } from '../types'

/**
 * Searches through a contract list to find a particular contract keyed by chain id and address
 * @param contractList
 * @param chainId
 * @param address
 * @returns
 */
export const findInContractList = (
  contractList: ContractList,
  chainId: number,
  address: string
): Contract | undefined => {
  return contractList.contracts.find(
    (contract: Contract) => contract.chainId === chainId && contract.address === address
  )
}
