import { initializePrizePools, PrizePool } from './PrizePool'
import { Contract as ContractMetadata, ContractList } from '@pooltogether/contract-list-schema'
import { ContractType } from './constants'
import { Draw, PrizeTier, Providers } from './types'
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'
import { Result } from '@ethersproject/abi'
import { initializePrizeDistributors, PrizeDistributor } from './PrizeDistributor'

/**
 * A Prize Pool Network (a group of Prize Pools).
 * Provides read only functions for getting data needed to display to users.
 * Initializes several PrizePools.
 *
 * NOTE: Initialization is still up in the air since the way we're using
 * contract lists to store Prize Pool Network data is constantly changing.
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
   *
   * @constructor
   * @param providers
   * @param prizePoolNetworkContractList
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

  //////////////////////////// Ethers read functions ////////////////////////////

  /**
   * Fetch the users balances for all relevant tokens for all Prize Pools in the Prize Pool Network.
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
  async getBeaconChainDraws(): Promise<{ [drawId: number]: Draw }> {
    const drawIds = await this.getBeaconChainDrawIds()
    const draws: { [drawId: number]: Draw } = {}
    const result: Result = await this.drawBufferContract.functions.getDraws(drawIds)
    result[0].forEach((draw: Draw) => {
      draws[draw.drawId] = {
        drawId: draw.drawId,
        timestamp: draw.timestamp,
        winningRandomNumber: draw.winningRandomNumber
      }
    })
    return draws
  }

  /**
   *
   * @returns
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
   *
   * @param chainId
   * @param address
   * @returns
   */
  getPrizePool(chainId: number, address: string): PrizePool | undefined {
    return this.prizePools.find(
      (prizePool) => prizePool.chainId === chainId && prizePool.address === address
    )
  }

  /**
   *
   * @param chainId
   * @param address
   * @returns
   */
  getPrizeDistributor(chainId: number, address: string): PrizeDistributor | undefined {
    return this.prizeDistributors.find(
      (prizeDistributor) =>
        prizeDistributor.chainId === chainId && prizeDistributor.address === address
    )
  }

  /**
   *
   */
  id(): string {
    return `prize-pool-network-${this.beaconChainId}-${this.beaconAddress}`
  }
}
