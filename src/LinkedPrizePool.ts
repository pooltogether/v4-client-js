import { Provider } from '@ethersproject/abstract-provider'
import { PrizePool } from './PrizePool'
import { Contract as ContractMetadata, ContractList } from '@pooltogether/contract-list-schema'
import { ContractType } from './constants'
import { contract as etherplexContract, batch, Context } from '@pooltogether/etherplex'
import { Draw, Providers } from './types'
import { BaseProvider } from '@ethersproject/providers'
import ERC20Abi from './abis/ERC20Abi'
import { extendContractWithChildren } from './utils/extendContractWithChildren'
import { getContractsByType } from './utils/getContractsByType'
import { sortContractsByContractTypeAndChildren } from './utils/sortContractsByContractTypeAndChildren'
import { sortContractsByChainId } from './utils/sortContractsByChainId'
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'
import { Result } from '@ethersproject/abi'

interface PrizePoolAddresses {
  [prizePoolAddress: string]: {
    token: string
    ticket: string
  }
}

interface PrizePoolAddressesByChainId {
  [chainId: number]: PrizePoolAddresses
}

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

  // Used to uniquely identify the Linked Prize Pool. TODO: Probably use something better?
  readonly beaconChainId: number
  readonly beaconAddress: string

  // Contract metadata
  readonly drawBeaconMetadata: ContractMetadata
  readonly drawBufferMetadata: ContractMetadata

  // Ethers contracts
  readonly drawBeaconContract: Contract
  readonly drawBufferContract: Contract

  /**
   *
   * @constructor
   * @param providers
   * @param linkedPrizePoolContractList
   */
  constructor(providers: Providers, linkedPrizePoolContractList: ContractList) {
    this.providers = providers
    this.contractList = linkedPrizePoolContractList
    this.prizePools = createPrizePools(providers, linkedPrizePoolContractList.contracts)

    // DrawBeacon
    const drawBeaconContractMetadata = linkedPrizePoolContractList.contracts.find(
      (c) => c.type === ContractType.DrawBeacon
    ) as ContractMetadata
    const beaconChainId = drawBeaconContractMetadata.chainId
    const beaconProvider = providers[beaconChainId]
    const drawBeaconContract = new Contract(
      drawBeaconContractMetadata.address,
      drawBeaconContractMetadata.abi,
      beaconProvider
    )

    // DrawBuffer
    const drawBufferContractMetadata = linkedPrizePoolContractList.contracts.find(
      (c) => c.type === ContractType.DrawBuffer && c.chainId === beaconChainId
    ) as ContractMetadata
    const drawBufferContract = new Contract(
      drawBufferContractMetadata.address,
      drawBufferContractMetadata.abi,
      beaconProvider
    )

    // Set values
    this.drawBeaconMetadata = drawBeaconContractMetadata
    this.drawBeaconContract = drawBeaconContract
    this.drawBufferMetadata = drawBufferContractMetadata
    this.drawBufferContract = drawBufferContract
    this.beaconChainId = beaconChainId
    this.beaconAddress = drawBeaconContractMetadata.address
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  /**
   * Fetch the users balances for all relevant tokens for all Prize Pools in the Linked Prize Pool.
   * @param usersAddress address to get balances for
   * @returns an array of objects containing the chain id & Prize Pool address and a balances object
   * with the users balances for relevant tokens to the prize pool
   */
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

  /**
   *
   * @returns
   */
  async getDrawBeaconPeriod() {
    const [periodSecondsResult, periodStartedAtResult, nextDrawIdResult] = await Promise.all([
      this.drawBeaconContract.functions.getBeaconPeriodSeconds(),
      this.drawBeaconContract.functions.getBeaconPeriodStartedAt(),
      this.drawBeaconContract.functions.getNextDrawId()
    ])
    const startedAtSeconds: BigNumber = periodStartedAtResult[0]
    const periodSeconds: number = periodSecondsResult[0]
    const endsAtSeconds: BigNumber = startedAtSeconds.add(periodSeconds)
    const drawId: number = nextDrawIdResult[0]
    return {
      startedAtSeconds,
      periodSeconds,
      endsAtSeconds,
      drawId
    }
  }

  /**
   *
   * @returns
   */
  async getAllDrawIds(): Promise<number[]> {
    const [oldestDrawResponse, newestDrawResponse] = await Promise.allSettled([
      this.drawBufferContract.functions.getOldestDraw(),
      this.drawBufferContract.functions.getNewestDraw()
    ])

    if (newestDrawResponse.status === 'rejected' || oldestDrawResponse.status === 'rejected') {
      return []
    }

    const oldestId = oldestDrawResponse.value[0].drawId
    const newestId = newestDrawResponse.value[0].drawId

    const drawIds = []
    for (let i = oldestId; i <= newestId; i++) {
      drawIds.push(i)
    }

    return drawIds
  }

  /**
   *
   * @returns
   */
  async getAllDraws(): Promise<Draw[]> {
    const drawIds = await this.getAllDrawIds()
    const result: Result = await this.drawBufferContract.functions.getDraws(drawIds)
    return result[0]
  }

  /**
   *
   */
  id(): string {
    return `linked-prize-pool-${this.beaconChainId}-${this.beaconAddress}`
  }
}

/**
 * Utility function to create several Prize Pools from a contract list.
 * NOTE: Requires Prize Pool contracts to be extended with "children".
 * @param providers
 * @param contracts
 * @returns
 */
function createPrizePools(providers: Providers, contracts: ContractMetadata[]): PrizePool[] {
  const prizePoolContractLists = sortContractsByContractTypeAndChildren(
    contracts,
    ContractType.YieldSourcePrizePool
  )
  const prizePools: PrizePool[] = []
  prizePoolContractLists.forEach((contracts) => {
    const prizePoolMetadata = contracts.find(
      (contract) => contract.type === ContractType.YieldSourcePrizePool
    ) as ContractMetadata
    const provider = providers[prizePoolMetadata.chainId]
    try {
      prizePools.push(new PrizePool(prizePoolMetadata, provider, contracts))
    } catch (e) {
      const error = e as Error
      console.error(error.message)
    }
  })

  return prizePools
}

//////////////////////////// PROBABLY TEMPORARY PRIZE POOL INITIALIZATION ////////////////////////////

/**
 * - Fetches contract addresses on chain for the provided Prize Pool contracts
 * and extends the Prize Pool contracts with "children".
 * - Injects a contract for the underlying ERC20 of a Prize Pool.
 * Can be bypassed by simply adding "children" extensions into the
 * contract list & including a "Token" contract.
 * @constructor
 * @param providers
 * @param linkedPrizePoolContractList a flat contract list with no extensions
 * @returns
 */
export async function initializeLinkedPrizePool(
  providers: Providers,
  linkedPrizePoolContractList: ContractList
): Promise<LinkedPrizePool | null> {
  const contracts = linkedPrizePoolContractList.contracts
  const prizePoolContracts = getContractsByType(contracts, ContractType.YieldSourcePrizePool)
  const prizePoolContractsByChainId = sortContractsByChainId(prizePoolContracts)
  const chainIds = Object.keys(prizePoolContractsByChainId).map(Number)

  // Fetch relevant child addresses
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
      console.error(
        'Fetching contract addresses for prize pools failed with error: ',
        response.reason
      )
    }
  })
  const prizePoolAddressesByChainId = {} as PrizePoolAddressesByChainId
  prizePoolAddresses.forEach(
    (ppa) => (prizePoolAddressesByChainId[ppa.chainId] = ppa.addressesByPrizePool)
  )

  // Extend the contracts with the child contracts
  const contractsWithChildren = extendContractWithChildren(
    contracts,
    prizePoolAddressesByChainId,
    ContractType.YieldSourcePrizePool
  )

  // Inject a contract for the underlying token
  const contractsWithToken = extendContractsWithToken(contractsWithChildren)
  const updatedContractList = { ...linkedPrizePoolContractList, contracts: contractsWithToken }
  return new LinkedPrizePool(providers, updatedContractList)
}

/**
 * Fetches child contracts for a Prize Pool:
 * - Token (underlying token)
 * - Ticket
 * @param chainId
 * @param provider
 * @param prizePoolContracts
 * @returns
 */
async function fetchPrizePoolAddressesByChainId(
  chainId: number,
  provider: Provider,
  prizePoolContracts: ContractMetadata[]
) {
  const batchCalls = [] as Context[]
  prizePoolContracts.forEach((prizePoolContract) => {
    const prizePoolEtherplexContract = etherplexContract(
      prizePoolContract.address,
      prizePoolContract.abi,
      prizePoolContract.address
    )
    // @ts-ignore: Property doesn't exist on MulticallContract
    batchCalls.push(prizePoolEtherplexContract.getToken().getTicket())
  })
  const result = await batch(provider as BaseProvider, ...batchCalls)
  const addressesByPrizePool = {} as PrizePoolAddresses
  Object.keys(result).forEach(
    (prizePoolAddress: any) =>
      (addressesByPrizePool[prizePoolAddress] = {
        token: result[prizePoolAddress].getToken[0],
        ticket: result[prizePoolAddress].getTicket[0]
      })
  )
  return { chainId, addressesByPrizePool }
}

/**
 * Injects a contract for the underlying token into the contract list if there isn't one.
 * @param contracts
 * @returns
 */
function extendContractsWithToken(contracts: ContractMetadata[]) {
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
  } as ContractMetadata
}
