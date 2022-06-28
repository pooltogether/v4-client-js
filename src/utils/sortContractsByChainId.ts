import { Contract } from '../types'

export function sortContractsByChainId(contracts: Contract[]): { [key: number]: Contract[] } {
  const sortedContracts = {} as { [key: number]: Contract[] }
  const chainIds = new Set(contracts.map((c) => c.chainId))
  chainIds.forEach((chainId) => {
    const filteredContracts = contracts.filter((c) => c.chainId === chainId)
    sortedContracts[chainId] = filteredContracts
  })
  return sortedContracts
}
