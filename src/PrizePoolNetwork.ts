import { Result } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Contract as ContractMetadata, ContractList } from '@pooltogether/contract-list-schema'

import { ContractType } from './constants'
import { initializePrizeDistributors, PrizeDistributor } from './PrizeDistributor'
import { initializePrizePools, PrizePool } from './PrizePool'
import { Draw, PrizeTier, Providers } from './types'

/**
 * A Prize Pool Network.
 * The network consists of one or more Prize Pools and Prize Distributors. PrizePoolNetwork provides read only functions for reading data from the contracts that make up the network. Initializes several PrizePools and PrizeDistributors on creation.
 */
export class PrizePoolNetwork {
  readonly providers: Providers
  readonly prizePools: PrizePool[]
  readonly prizeDistributors: PrizeDistributor[]
  readonly contractList: ContractList

  // Used to uniquely identify the Prize Pool Network. TODO: Probably use something better?
  readonly beaconChainId: number
  readonly beaconAddress: string

  // Contract metadata
  readonly drawBeaconMetadata: ContractMetadata
  readonly drawBufferMetadata: ContractMetadata
  readonly prizeTierHistoryMetadata: ContractMetadata

  // Ethers contracts
  readonly drawBeaconContract: Contract
  readonly drawBufferContract: Contract
  readonly prizeTierHistoryContract: Contract

  /**
   * Create an instance of a PrizePoolNetwork by providing ethers Providers for each relevant network and a Contract List.
   * @constructor
   * @param providers ethers Providers for each network in the Prize Pool Network, keyed by their chain id.
   * @param prizePoolNetworkContractList a Contract List containing all of the relevant metadata for the Prize Pool Network.
   */
  constructor(providers: Providers, prizePoolNetworkContractList: ContractList) {
    this.providers = providers
    this.contractList = prizePoolNetworkContractList
    this.prizePools = initializePrizePools(prizePoolNetworkContractList, providers)
    this.prizeDistributors = initializePrizeDistributors(prizePoolNetworkContractList, providers)

    // DrawBeacon
    const drawBeaconContractMetadata = prizePoolNetworkContractList.contracts.find(
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
    const drawBufferContractMetadata = prizePoolNetworkContractList.contracts.find(
      (c) => c.type === ContractType.DrawBuffer && c.chainId === beaconChainId
    ) as ContractMetadata
    const drawBufferContract = new Contract(
      drawBufferContractMetadata.address,
      drawBufferContractMetadata.abi,
      beaconProvider
    )

    // PrizeTierHistory
    const prizeTierHistoryContractMetadata = prizePoolNetworkContractList.contracts.find(
      (c) => c.type === ContractType.PrizeTierHistory && c.chainId === beaconChainId
    ) as ContractMetadata
    const prizeTierHistoryContract = new Contract(
      prizeTierHistoryContractMetadata.address,
      prizeTierHistoryContractMetadata.abi,
      beaconProvider
    )

    // Set values
    this.beaconChainId = beaconChainId
    this.beaconAddress = drawBeaconContractMetadata.address
    this.drawBeaconMetadata = drawBeaconContractMetadata
    this.drawBeaconContract = drawBeaconContract
    this.drawBufferMetadata = drawBufferContractMetadata
    this.drawBufferContract = drawBufferContract
    this.prizeTierHistoryMetadata = prizeTierHistoryContractMetadata
    this.prizeTierHistoryContract = prizeTierHistoryContract
  }

  /**
   * Returns a unique id string for this PrizePoolNetwork.
   * @returns a unique id for the PrizePoolNetwork
   */
  id(): string {
    return `prize-pool-network-${this.beaconChainId}-${this.beaconAddress}`
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  /**
   * Fetch the users balances for all relevant tokens for all Prize Pools in the Prize Pool Network.
   * @param usersAddress address to get balances for.
   * @returns an array of objects containing the chain id & Prize Pool address and a balances object with the users balances for relevant tokens to the prize pool
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
   * Fetch the current Draw Beacon period data from the beacon Prize Pool.
   * @returns the current draw beacon period.
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
   * Fetch the range of available draw ids in the Draw Buffer for the beacon Prize Pool.
   * @returns an array of draw ids
   */
  async getBeaconChainDrawIds(): Promise<number[]> {
    const [oldestDrawResponse, newestDrawResponse] = await Promise.allSettled([
      this.drawBufferContract.functions.getOldestDraw(),
      this.drawBufferContract.functions.getNewestDraw()
    ])

    if (newestDrawResponse.status === 'rejected' || oldestDrawResponse.status === 'rejected') {
      return []
    }

    const oldestId = oldestDrawResponse.value[0].drawId
    const newestId = newestDrawResponse.value[0].drawId

    const drawIds: number[] = []
    for (let i = oldestId; i <= newestId; i++) {
      drawIds.push(i)
    }

    return drawIds
  }

  /**
   * Fetch all of the available Draws in the Draw Buffer for the beacon Prize Pool.
   * @returns an object of draws keyed by their draw id
   */
  async getBeaconChainDraws(): Promise<{ [drawId: number]: Draw }> {
    const drawIds = await this.getBeaconChainDrawIds()
    const draws: { [drawId: number]: Draw } = {}
    const result: Result = await this.drawBufferContract.functions.getDraws(drawIds)
    result[0].forEach((draw: Draw) => {
      draws[draw.drawId] = {
        drawId: draw.drawId,
        timestamp: draw.timestamp,
        winningRandomNumber: draw.winningRandomNumber,
        beaconPeriodStartedAt: draw.beaconPeriodStartedAt,
        beaconPeriodSeconds: draw.beaconPeriodSeconds
      }
    })
    return draws
  }

  /**
   * Fetches the upcoming prize tier data from the prize tier history contract. This data is used for the next prize distribution that will be added to the Prize Distribution Buffer for the beacon Prize Pool.
   * @returns the upcoming prize tier
   */
  async getUpcomingPrizeTier(): Promise<PrizeTier> {
    const [drawId]: number[] = await this.prizeTierHistoryContract.functions.getNewestDrawId()
    const result: Result = await this.prizeTierHistoryContract.functions.getPrizeTier(drawId)
    return {
      bitRangeSize: result[0].bitRangeSize,
      expiryDuration: result[0].expiryDuration,
      maxPicksPerUser: result[0].maxPicksPerUser,
      prize: result[0].prize,
      tiers: result[0].tiers
    }
  }

  /**
   * Returns a PrizePool from the list of Prize Pools that was created on initialization by their primary key. The primary key of a Prize Pool is the chain id it is on and the address of the YieldSourcePrizePool contract.
   * @param chainId the chain id the requested prize pool is on
   * @param address the address of the YieldSourcePrizePool contract
   * @returns
   */
  getPrizePool(chainId: number, address: string): PrizePool | undefined {
    return this.prizePools.find(
      (prizePool) => prizePool.chainId === chainId && prizePool.address === address
    )
  }

  /**
   * Returns a PrizeDistributor from the list of Prize Distributors that was created on initialization by their primary key. The primary key of a Prize Disctributor is the chain id it is on and the address of the PrizeDistributor contract.
   * @param chainId the chain id the requested prize distributor is on
   * @param address the address of the PrizeDistributor contract
   * @returns
   */
  getPrizeDistributor(chainId: number, address: string): PrizeDistributor | undefined {
    return this.prizeDistributors.find(
      (prizeDistributor) =>
        prizeDistributor.chainId === chainId && prizeDistributor.address === address
    )
  }
}
