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
    const chainId = contract.chainId
    const keyedRelevantAddresses =
      childContractAddressesByChainId?.[contract.chainId]?.[contract.address]
    if (contract.type !== contractType || !keyedRelevantAddresses) return contract

    return {
      ...contract,
      extensions: {
        ...contract.extensions,
        children: Object.values(keyedRelevantAddresses).map((address) => ({ chainId, address }))
      }
    }
  })
}
