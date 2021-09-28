import { ContractType } from '../constants'
import { getContractsByType } from './getContractsByType'
import { Contract, ContractIdentifier } from '../types'

/**
 * Reads the contract list and pulls out connected contracts based on the
 * children extension.
 *
 * NOTE: This extension is added in the intialize functions for creating the instances of
 * LinkedPrizePool and DrawPrizes
 */
export function sortContractsByContractTypeAndChildren(
  contracts: Contract[],
  contractType: ContractType
): Contract[][] {
  const prizePoolContracts = getContractsByType(contracts, contractType)
  return prizePoolContracts.map((prizePoolContract) => {
    return [prizePoolContract, ...findChildContracts(prizePoolContract, contracts)]
  })
}

function findChildContracts(parentContract: Contract, contracts: Contract[]): Contract[] {
  const children = parentContract.extensions?.children as ContractIdentifier[]
  if (!children) return []
  if (!Array.isArray(children)) throw new Error('Invalid children extension')

  const childContracts = [] as Contract[]
  children.forEach((childIdentifier) => {
    const childContract = contracts.find((contract) =>
      isMatchingContractIdentifier(childIdentifier, contract)
    )
    if (childContract) childContracts.push(childContract)
  })

  return childContracts
}

function isMatchingContractIdentifier(contractIdentifier: ContractIdentifier, contract: Contract) {
  return (
    contractIdentifier.address === contract.address &&
    contractIdentifier.chainId === contract.chainId
  )
}
