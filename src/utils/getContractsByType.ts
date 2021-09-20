import { ContractType } from '../constants'
import { Contract } from '../types'

export function getContractsByType(contracts: Contract[], type: ContractType) {
  return contracts.filter((contract) => contract.type === type)
}
