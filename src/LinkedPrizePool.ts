import { initializePrizePools, PrizePool } from './PrizePool'
import { Contract as ContractMetadata, ContractList } from '@pooltogether/contract-list-schema'
import { ContractType } from './constants'
import { Draw, Providers } from './types'
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from '@ethersproject/bignumber'
import { Result } from '@ethersproject/abi'
import { initializePrizeDistributors, PrizeDistributor } from './PrizeDistributor'

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
  readonly prizeDistributors: PrizeDistributor[]
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
    this.prizePools = initializePrizePools(linkedPrizePoolContractList, providers)
    this.prizeDistributors = initializePrizeDistributors(linkedPrizePoolContractList, providers)

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
    return `linked-prize-pool-${this.beaconChainId}-${this.beaconAddress}`
  }
}
