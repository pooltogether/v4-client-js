import { Provider } from '@ethersproject/abstract-provider'
import { PrizePool } from './PrizePool'
import { Contract, ContractIdentifier, ContractList } from '@pooltogether/contract-list-schema'
import { ContractType } from './constants'
import { contract as etherplexContract, batch, Context } from '@pooltogether/etherplex'
import { ethers } from 'ethers'
import { Providers } from './types'
import { BaseProvider } from '@ethersproject/providers'
import ERC20Abi from './abis/ERC20Abi'

/**
 * A Linked Prize Pool (a group of Prize Pools).
 * Provides read only functions for getting data needed to display to users.
 * Initializes several PrizePools.
 *
 * NOTE: Initialization is still up in the air since the way we're using
 * contract lists to store Linked Prize Pool data is constantly changing.
 */
export class LinkedPrizePool {
  readonly providers: Providers
  readonly prizePools: PrizePool[]
  readonly contractList: ContractList

  constructor(providers: Providers, linkedPrizePoolContractList: ContractList) {
    this.providers = providers
    this.contractList = linkedPrizePoolContractList
    this.prizePools = createPrizePools(providers, linkedPrizePoolContractList.contracts)
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  async getUsersPrizePoolBalances(usersAddress: string) {
    const balancesPromises = this.prizePools.map(async (prizePool) => {
      const balances = await prizePool.getUsersPrizePoolBalances(usersAddress)
      return {
        chainId: prizePool.chainId,
        address: prizePool.address,
        balances
      }
    })
    return Promise.all(balancesPromises)
  }
}

function createPrizePools(providers: Providers, contracts: Contract[]): PrizePool[] {
  const prizePoolContractLists = sortContractListByPrizePools(contracts)
  return prizePoolContractLists.map((contracts) => {
    const prizePoolContract = contracts.find(
      (contract) => contract.type === ContractType.YieldSourcePrizePool
    ) as Contract
    const provider = providers[prizePoolContract.chainId]
    return new PrizePool(provider, contracts)
  })
}

//////////////////////////// HELPERS ////////////////////////////

export function getContractsByType(contracts: Contract[], type: ContractType) {
  return contracts.filter((contract) => contract.type === type)
}

export function sortContractsByChainId(contracts: Contract[]): { [key: number]: Contract[] } {
  const sortedContracts = {} as { [key: number]: Contract[] }
  const chainIds = new Set(contracts.map((c) => c.chainId))
  chainIds.forEach((chainId) => {
    const filteredContracts = contracts.filter((c) => c.chainId === chainId)
    sortedContracts[chainId] = filteredContracts
  })
  return sortedContracts
}

export function getContractListChainIds(contracts: Contract[]): number[] {
  return Array.from(new Set(contracts.map((c) => c.chainId)))
}

/**
 * Reads the contract list and pulls out connected contracts based on the
 * parent extension.
 *
 * TODO: We're not adding this extension for the time being since it's too
 * hard to generate it.
 */
function sortContractListByPrizePools(contracts: Contract[]): Contract[][] {
  const prizePoolContracts = getContractsByType(contracts, ContractType.YieldSourcePrizePool)
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

//////////////////////////// PROBABLY TEMPORARY PRIZE POOL INITIALIZATION ////////////////////////////

/**
 * Fetches contract addresses on chain so we can link them to the proper
 * Prize Pool. May be replaced in the future by adding extensions into the
 * contract list.
 */
export async function initializeLinkedPrizePool(
  providers: Providers,
  linkedPrizePoolContractList: ContractList
): Promise<LinkedPrizePool | null> {
  const contracts = linkedPrizePoolContractList.contracts
  const prizePoolContracts = getContractsByType(contracts, ContractType.YieldSourcePrizePool)
  const prizePoolContractsByChainId = sortContractsByChainId(prizePoolContracts)
  const chainIds = Object.keys(prizePoolContractsByChainId).map(Number)
  const prizePoolAddressBatchRequestPromises = chainIds.map((chainId) =>
    fetchPrizePoolAddressesByChainId(
      chainId,
      providers[chainId],
      prizePoolContractsByChainId[chainId]
    )
  )
  const prizePoolAddressesResponses = await Promise.allSettled(prizePoolAddressBatchRequestPromises)
  const prizePoolAddresses: {
    chainId: number
    addressesByPrizePool: PrizePoolAddresses
  }[] = []
  prizePoolAddressesResponses.forEach((response) => {
    if (response.status === 'fulfilled') {
      prizePoolAddresses.push(response.value)
    } else {
      console.warn('Fetching contract addresses failed with error: ', response.reason)
    }
  })
  const prizePoolAddressesByChainId = {} as PrizePoolAddressesByChainId
  prizePoolAddresses.forEach(
    (ppa) => (prizePoolAddressesByChainId[ppa.chainId] = ppa.addressesByPrizePool)
  )
  const contractsWithChildren = extendPrizePoolsWithChildren(contracts, prizePoolAddressesByChainId)
  const contractsWithToken = extendContractsWithToken(contractsWithChildren)
  const updatedContractList = { ...linkedPrizePoolContractList, contracts: contractsWithToken }
  return new LinkedPrizePool(providers, updatedContractList)
}

interface PrizePoolAddresses {
  [prizePoolAddress: string]: {
    token: string
    ticket: string
  }
}

interface PrizePoolAddressesByChainId {
  [chainId: number]: PrizePoolAddresses
}

async function fetchPrizePoolAddressesByChainId(
  chainId: number,
  provider: Provider,
  prizePoolContracts: Contract[]
) {
  const batchCalls = [] as Context[]
  prizePoolContracts.forEach((prizePoolContract) => {
    const prizePoolEtherplexContract = etherplexContract(
      prizePoolContract.address,
      prizePoolContract.abi,
      prizePoolContract.address
    )
    // @ts-ignore: Property doesn't exist on MulticallContract
    batchCalls.push(prizePoolEtherplexContract.token().tokenAtIndex(ethers.constants.Zero))
  })
  const result = await batch(provider as BaseProvider, ...batchCalls)
  const addressesByPrizePool = {} as PrizePoolAddresses
  Object.keys(result).forEach(
    (prizePoolAddress: any) =>
      (addressesByPrizePool[prizePoolAddress] = {
        token: result[prizePoolAddress].token[0],
        ticket: result[prizePoolAddress].tokenAtIndex[0]
      })
  )
  return { chainId, addressesByPrizePool }
}

/**
 * We aren't labelling contracts, so this tags "children" on
 * the Prize Pool contract.
 * Currently children only includes: Ticket, Token
 */
function extendPrizePoolsWithChildren(
  contracts: Contract[],
  prizePoolAddressesByChainId: PrizePoolAddressesByChainId
) {
  return contracts.map((contract) => {
    if (contract.type !== ContractType.YieldSourcePrizePool) return contract
    const chainId = contract.chainId
    const relevantAddresses = Object.values(
      prizePoolAddressesByChainId[contract.chainId][contract.address]
    )
    return {
      ...contract,
      extensions: {
        ...contract,
        children: relevantAddresses.map((address) => ({ chainId, address }))
      }
    }
  })
}

/**
 * We don't have the underlying token in the contract list, so this
 * injects it for the time being.
 */
function extendContractsWithToken(contracts: Contract[]) {
  const updatedContracts = [...contracts]
  const tokens: { address: string; chainId: number }[] = contracts
    .filter((contract) => {
      return Boolean(contract.extensions?.children)
    })
    .flatMap((contract) => contract.extensions?.children)
  tokens.forEach((token) => {
    const tokenContract = contracts.find(
      (contract) => contract.address === token.address && contract.chainId === token.chainId
    )
    if (!tokenContract) {
      updatedContracts.push(createTokenContract(token.chainId, token.address))
    }
  })
  return updatedContracts
}

function createTokenContract(chainId: number, address: string) {
  return {
    chainId,
    address,
    version: {
      major: 1,
      minor: 0,
      patch: 0
    },
    type: 'Token',
    abi: ERC20Abi,
    tags: [],
    extensions: {}
  } as Contract
}

//////////////////////////// NOT USED RIGHT NOW, SAVING FOR LATER ////////////////////////////

/**
 * TODO: Probably better to switch this around and tag the parent with its children
 * Uses the parent extension, searches through all contracts and recursively finds
 * contracts with a relationship.
 */
// function findChildContractsByParent(parentContract: Contract, contracts: Contract[]): Contract[] {
//   const relatedContracts = contracts.filter((contract) =>
//     isParentContract(parentContract, contract)
//   )
//   const relatedContractsChildContracts = relatedContracts.flatMap((contract) =>
//     findChildContracts(contract, contracts)
//   )
//   return [...relatedContracts, ...relatedContractsChildContracts]
// }
//
// function isParentContract(parentContract: Contract, childContract: Contract) {
//   const parent = childContract?.extensions?.parent as ContractIdentifier
//   return (
//     parent && parent.address === parentContract.address && parent.chainId === parentContract.chainId
//   )
// }

function isMatchingContractIdentifier(contractIdentifier: ContractIdentifier, contract: Contract) {
  return (
    contractIdentifier.address === contract.address &&
    contractIdentifier.chainId === contract.chainId
  )
}
