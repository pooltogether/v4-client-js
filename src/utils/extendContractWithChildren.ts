import { ChildContractAddresses, Contract } from '../types'
import { ContractType } from '../constants'

/**
 * We aren't labelling contracts, so this tags fetched "children" on a contract
 * Currently children only includes: Ticket, Token
 */
export function extendContractWithChildren(
  contracts: Contract[],
  childContractAddressesByChainId: ChildContractAddresses,
  contractType: ContractType
) {
  return contracts.map((contract) => {
    if (contract.type !== contractType) return contract
    const chainId = contract.chainId
    const relevantAddresses = Object.values(
      childContractAddressesByChainId[contract.chainId][contract.address]
    )
    return {
      ...contract,
      extensions: {
        ...contract.extensions,
        children: relevantAddresses.map((address) => ({ chainId, address }))
      }
    }
  })
}
