import { Contract } from '../types'

export function getContractListChainIds(contracts: Contract[]): number[] {
  return Array.from(new Set(contracts.map((c) => c.chainId)))
}
