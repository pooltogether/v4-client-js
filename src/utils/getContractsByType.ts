import { ContractType, VERSION_1 } from '../constants'
import { Contract, Version } from '../types'

export function getContractsByType(
  contracts: Contract[],
  type: ContractType,
  version: Version = VERSION_1
): Contract[] {
  return contracts.filter(
    (contract) =>
      contract.type === type && JSON.stringify(contract.version) === JSON.stringify(version)
  )
}
