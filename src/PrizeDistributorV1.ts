import { Result } from '@ethersproject/abi'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { Contract, Overrides } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { encodeWinningPicks } from '@pooltogether/v4-utils-js'
import { BigNumber, ethers } from 'ethers'

import { ContractType } from './constants'
import { PrizeApi } from './PrizeApi'
import { PrizeDistributor } from './PrizeDistributor'
import {
  Contract as ContractMetadata,
  ContractList,
  Draw,
  PrizeDistribution,
  DrawResults,
  Claim,
  SignersOrProviders
} from './types'
import { validateAddress } from './utils'

/**
 * A V1 Prize Distributor.
 * Provides access to the contracts for viewing expiration times on draws, timelock timers and checking/claiming prizes for a user. Can be instantiated with an ethers Signer or Provider. Use a Signer if you want to claim transactions for a user. If a provider is provided, only read methods are available.
 */
export class PrizeDistributorV1 extends PrizeDistributor {
  // Contract metadata
  drawCalculatorMetadata: ContractMetadata | undefined
  drawCalculatorTimelockMetadata: ContractMetadata | undefined
  drawBufferMetadata: ContractMetadata | undefined
  prizeDistributionsBufferMetadata: ContractMetadata | undefined
  tokenMetadata: ContractMetadata | undefined

  // Ethers contracts
  drawCalculatorContract: Contract | undefined
  drawCalculatorTimelockContract: Contract | undefined
  drawBufferContract: Contract | undefined
  prizeDistributionsBufferContract: Contract | undefined
  tokenContract: Contract | undefined

  /**
   * Create an instance of a PrizeDistributor by providing the metadata of the PrizeDistributor contract, an ethers Provider or Signer for the network the PrizeDistributor contract is deployed on and a list of contract metadata for the other contracts that make up the PrizeDistributor.
   * @param prizeDistributorMetadata
   * @param signerOrProvider
   * @param contractMetadataList
   */
  constructor(
    prizeDistributorMetadata: ContractMetadata,
    signerOrProvider: Provider | Signer,
    contractMetadataList: ContractMetadata[]
  ) {
    super(prizeDistributorMetadata, signerOrProvider, contractMetadataList)
  }

  /**
   * Returns a unique id string for this PrizeDistributor.
   * @returns a unique id for the PrizeDistributor
   */
  id(): string {
    return `${this.prizeDistributorMetadata.address}-${this.prizeDistributorMetadata.chainId}`
  }

  //////////////////////////// Ethers write functions ////////////////////////////

  /**
   * Fetches a users prizes for the provided draw and submits a transaction to claim them to the Signer.
   * PrizeDistributor must be initialized with a Signer.
   * @param drawId the draw id to claim prizes for
   * @param maxPicksPerUser the maximum picks per user from the PrizeDistribution for the provided draw id
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async claimPrizesByDraw(
    drawId: number,
    maxPicksPerUser: number,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'PrizeDistributorV1 [claim] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)

    const drawResults = await this.getUsersDrawResultsForDrawId(
      usersAddress,
      drawId,
      maxPicksPerUser
    )
    return this.claimPrizesByDrawResults(drawResults, overrides)
  }

  /**
   * Submits a transaction to claim a users prizes
   * PrizeDistributor must be initialized with a Signer.
   * @param drawResults the prize results for a user for a specific draw
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async claimPrizesByDrawResults(
    drawResults: DrawResults,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'PrizeDistributorV1 [claimPrizes] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)
    await this.validateSignerNetwork(errorPrefix)

    if (drawResults.totalValue.isZero()) {
      throw new Error(errorPrefix + 'No prizes to claim.')
    }

    const claim: Claim = encodeWinningPicks(usersAddress, [drawResults])
    if (Boolean(overrides)) {
      return this.prizeDistributorContract.claim(
        claim.userAddress,
        claim.drawIds,
        claim.encodedWinningPickIndices,
        overrides
      )
    } else {
      return this.prizeDistributorContract.claim(
        claim.userAddress,
        claim.drawIds,
        claim.encodedWinningPickIndices
      )
    }
  }

  /**
   * Submits a transaction to claim a users prizes across multiple draws
   * PrizeDistributor must be initialized with a Signer.
   * @param drawResults an object of the users draw results to claim keyed by draw ids
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async claimPrizesAcrossMultipleDrawsByDrawResults(
    drawResults: {
      [drawId: number]: DrawResults
    },
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'PrizeDistributorV1 [claimPrizes] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)
    await this.validateSignerNetwork(errorPrefix)

    const drawResultsList = Object.values(drawResults)
    const totalValueToClaim = drawResultsList.reduce((total, drawResult) => {
      return total.add(drawResult.totalValue)
    }, ethers.BigNumber.from(0))

    if (totalValueToClaim.isZero()) {
      throw new Error(errorPrefix + 'No prizes to claim.')
    }

    const claim: Claim = encodeWinningPicks(usersAddress, drawResultsList)
    if (Boolean(overrides)) {
      return this.prizeDistributorContract.claim(
        claim.userAddress,
        claim.drawIds,
        claim.encodedWinningPickIndices,
        overrides
      )
    } else {
      return this.prizeDistributorContract.claim(
        claim.userAddress,
        claim.drawIds,
        claim.encodedWinningPickIndices
      )
    }
  }

  // NOTE: Events commented out as fetching events on networks other than Ethereum mainnet is unreliable.

  /**
   * Fetches claimed events for the provided user
   * @returns Event
   */
  // async getClaimedEvents() {
  //   const errorPrefix = 'PrizeDistributorV1 [getClaimedEvents] |'
  //   const usersAddress = await this.getUsersAddress(errorPrefix)

  //   return this.getUsersClaimedEvents(usersAddress)
  // }

  //////////////////////////// Ethers read functions ////////////////////////////

  /**
   * Fetches the newest PrizeDistribution in the PrizeDistributionBuffer related to the PrizeDistributor.
   * NOTE: Will throw an error if the buffer is empty.
   * @returns the newest prize distribution in the prize distribution buffer
   */
  async getNewestPrizeDistribution(): Promise<{
    prizeDistribution: PrizeDistribution
    drawId: number
  }> {
    const prizeDistributionBufferContract = await this.getPrizeDistributionsBufferContract()
    const result: Result = await prizeDistributionBufferContract.functions.getNewestPrizeDistribution()
    const prizeDistribution = result[0]
    const drawId: number = result[1]
    return {
      prizeDistribution: {
        matchCardinality: prizeDistribution.matchCardinality,
        numberOfPicks: prizeDistribution.numberOfPicks,
        tiers: prizeDistribution.tiers,
        bitRangeSize: prizeDistribution.bitRangeSize,
        prize: prizeDistribution.prize,
        startTimestampOffset: prizeDistribution.drawStartTimestampOffset,
        endTimestampOffset: prizeDistribution.drawEndTimestampOffset,
        maxPicksPerUser: prizeDistribution.maxPicksPerUser
      } as PrizeDistribution,
      drawId
    }
  }

  /**
   * Fetches the oldest PrizeDistribution in the PrizeDistributionBuffer related to the PrizeDistributor.
   * @returns the oldest prize distribution in the prize distribution buffer
   */
  async getOldestPrizeDistribution(): Promise<{
    prizeDistribution: PrizeDistribution
    drawId: number
  }> {
    const prizeDistributionBufferContract = await this.getPrizeDistributionsBufferContract()
    const result: Result = await prizeDistributionBufferContract.functions.getOldestPrizeDistribution()
    const prizeDistribution = result[0]
    const drawId: number = result[1]
    return {
      prizeDistribution: {
        matchCardinality: prizeDistribution.matchCardinality,
        numberOfPicks: prizeDistribution.numberOfPicks,
        tiers: prizeDistribution.tiers,
        bitRangeSize: prizeDistribution.bitRangeSize,
        prize: prizeDistribution.prize,
        startTimestampOffset: prizeDistribution.drawStartTimestampOffset,
        endTimestampOffset: prizeDistribution.drawEndTimestampOffset,
        maxPicksPerUser: prizeDistribution.maxPicksPerUser
      } as PrizeDistribution,
      drawId
    }
  }

  /**
   * Fetches the id and end time stamp of the draw that is currently in the DrawCalcluatorTimelock.
   * @returns the draw id and the end time as a unix time stamp in seconds
   */
  async getTimelockDrawId(): Promise<{
    drawId: number
    endTimeSeconds: BigNumber
  }> {
    const drawCalculatorTimelockContract = await this.getDrawCalculatorTimelockContract()
    if (!drawCalculatorTimelockContract) {
      throw new Error(
        'PrizeDistributorV1 [getTimelockDrawId] | No DrawCalculatorTimelock Contract found.'
      )
    }
    const timelockResult = await drawCalculatorTimelockContract.functions.getTimelock()
    const [endTimeSeconds, drawId] = timelockResult[0]
    return {
      drawId,
      endTimeSeconds
    }
  }

  /**
   * Fetches the range of draw ids for the prize distributions that are available in the PrizeDistributionBuffer.
   * @returns a list of draw ids in the buffer
   */
  async getDrawIdsFromPrizeDistributionBuffer(): Promise<number[]> {
    const [
      oldestPrizeDistributionResponse,
      newestPrizeDistributionResponse
    ] = await Promise.allSettled([
      this.getOldestPrizeDistribution(),
      this.getNewestPrizeDistribution()
    ])

    if (
      newestPrizeDistributionResponse.status === 'rejected' ||
      oldestPrizeDistributionResponse.status === 'rejected'
    ) {
      return []
    }

    const oldestId = oldestPrizeDistributionResponse.value.drawId
    const newestId = newestPrizeDistributionResponse.value.drawId

    const drawIds = []
    for (let i = oldestId; i <= newestId; i++) {
      drawIds.push(i)
    }

    return drawIds
  }

  /**
   * Gets the list of draw ids of draws that have are available in both the DrawBuffer and PrizeDistributionBuffer.
   * @returns a list of draw ids in both buffers
   */
  async getValidDrawIds(): Promise<number[]> {
    const [
      oldestPrizeDistributionResponse,
      newestPrizeDistributionResponse,
      oldestDrawResponse,
      newestDrawResponse
    ] = await Promise.allSettled([
      this.getOldestPrizeDistribution(),
      this.getNewestPrizeDistribution(),
      this.getOldestDraw(),
      this.getNewestDraw()
    ])
    // If newest failed, there are none
    // TODO: Check oldest for id 0 as well
    // TODO: Do the same empty states apply for the prize distribution buffer?
    if (
      oldestPrizeDistributionResponse.status === 'rejected' ||
      newestPrizeDistributionResponse.status === 'rejected' ||
      newestDrawResponse.status === 'rejected' ||
      oldestDrawResponse.status === 'rejected'
    ) {
      return []
    }

    const oldestPrizeDistributionId = oldestPrizeDistributionResponse.value.drawId
    const newestPrizeDistributionId = newestPrizeDistributionResponse.value.drawId
    const oldestDrawId = oldestDrawResponse.value.drawId
    const newestDrawId = newestDrawResponse.value.drawId

    const newestIds = [newestDrawId, newestPrizeDistributionId]

    const oldestId = Math.max(oldestPrizeDistributionId, oldestDrawId)
    const newestId = Math.min(...newestIds)

    if (newestId < oldestId) return []

    const validIds = []
    for (let i = oldestId; i <= newestId; i++) {
      validIds.push(i)
    }
    return validIds
  }

  /**
   * Fetches Draws and PrizeDistributions from their respective buffers for the provided list of draw ids.
   * @param drawIds the list of draw ids to fetch Draws and PrizeDistributions for
   * @returns an object full of Draws and PrizeDistributions keyed by their draw id
   */
  async getDrawsAndPrizeDistributions(
    drawIds: number[]
  ): Promise<{ [drawId: number]: { draw: Draw; prizeDistribution: PrizeDistribution } }> {
    const [drawsResponse, prizeDistributionsResponse] = await Promise.allSettled([
      this.getDraws(drawIds),
      this.getPrizeDistributions(drawIds)
    ])

    // If any are rejected, drop the largest draw id and retry
    // TODO: Make this error handling better.
    // There's a delay between setting the draw and the prize distribution so this will happen frequently.
    if (drawsResponse.status === 'rejected' || prizeDistributionsResponse.status === 'rejected') {
      return this.getDrawsAndPrizeDistributions(
        drawIds.sort((a, b) => a - b).slice(0, drawIds.length - 1)
      )
    }

    const drawsAndPrizeDistributions: {
      [drawId: number]: { draw: Draw; prizeDistribution: PrizeDistribution }
    } = {}
    Object.values(drawsResponse.value).forEach((draw, index) => {
      drawsAndPrizeDistributions[draw.drawId] = {
        draw,
        prizeDistribution: prizeDistributionsResponse.value[index]
      }
    })

    return drawsAndPrizeDistributions
  }

  /**
   * Fetches a PrizeDistribution from the PrizeDistributionBuffer.
   * @param drawId the draw id for the PrizeDistribution to fetch
   * @returns the PrizeDistribution
   */
  async getPrizeDistribution(drawId: number): Promise<PrizeDistribution> {
    const prizeDistributionsBufferContract = await this.getPrizeDistributionsBufferContract()
    const result: Result = await prizeDistributionsBufferContract.functions.getPrizeDistribution(
      drawId
    )
    return {
      matchCardinality: result[0].matchCardinality,
      tiers: result[0].tiers,
      bitRangeSize: result[0].bitRangeSize,
      maxPicksPerUser: result[0].maxPicksPerUser,
      numberOfPicks: result[0].numberOfPicks,
      expiryDuration: result[0].expiryDuration,
      prize: result[0].prize,
      startTimestampOffset: result[0].drawStartTimestampOffset,
      endTimestampOffset: result[0].drawEndTimestampOffset
    }
  }

  /**
   * Fetches multiple PrizeDistributions from the PrizeDistributionBuffer.
   * @param drawIds a list of draw ids to fetch PrizeDistributions for
   * @returns an object with PrizeDistributions keyed by draw ids
   */
  async getPrizeDistributions(drawIds: number[]): Promise<{ [drawId: number]: PrizeDistribution }> {
    if (!drawIds || drawIds.length === 0) {
      return {}
    }
    const prizeDistributionsBufferContract = await this.getPrizeDistributionsBufferContract()
    const prizeDistributionsResults: Result = await prizeDistributionsBufferContract.functions.getPrizeDistributions(
      drawIds
    )
    const prizeDistributions: { [drawId: number]: PrizeDistribution } = {}
    prizeDistributionsResults[0].forEach((result: PrizeDistribution, index: number) => {
      prizeDistributions[drawIds[index]] = {
        matchCardinality: result.matchCardinality,
        tiers: result.tiers,
        bitRangeSize: result.bitRangeSize,
        maxPicksPerUser: result.maxPicksPerUser,
        numberOfPicks: result.numberOfPicks,
        prize: result.prize,
        expiryDuration: result.expiryDuration,
        startTimestampOffset: result.startTimestampOffset,
        endTimestampOffset: result.endTimestampOffset
      }
    })
    return prizeDistributions
  }

  /**
   * Fetches a users normalized balance for several draw ids.
   * @param usersAddress the address of a user to fetch normalized balances for
   * @param drawIds a list of draw ids to fetch normalized balances for
   * @returns an object of normalized balances keyed by draw ids
   */
  async getUsersNormalizedBalancesForDrawIds(
    usersAddress: string,
    drawIds: number[]
  ): Promise<{ [drawId: number]: BigNumber }> {
    const errorPrefix = 'PrizeDistributorV1 [getUsersNormalizedBalancesForDrawIds] |'
    await validateAddress(errorPrefix, usersAddress)

    const drawCalculatorContract = await this.getDrawCalculatorContract()
    const result: Result = await drawCalculatorContract.functions.getNormalizedBalancesForDrawIds(
      usersAddress,
      drawIds
    )
    return result[0]
  }

  /**
   * Fetches the claimable prizes a user won for a specific Draw.
   * @param usersAddress the users address to fetch prizes for
   * @param drawId the draw id to fetch prizes for
   * @param maxPicksPerUser the maximum number of picks per user from the matching prize distribution
   * @returns the results for user for the provided draw
   */
  async getUsersDrawResultsForDrawId(
    usersAddress: string,
    drawId: number,
    maxPicksPerUser: number
  ): Promise<DrawResults> {
    return PrizeApi.getUsersDrawResultsByDraw(
      this.chainId,
      usersAddress,
      this.prizeDistributorMetadata.address,
      drawId,
      maxPicksPerUser
    )
  }

  /**
   * Fetches the claimable prizes a user won for multiple Draws.
   * @param usersAddress the users address to fetch prizes for
   * @param drawIds the draw ids to fetch prizes for
   * @param maxPicksPerUserPerDraw the maximum number of picks per user from the matching prize distribution for each draw
   * @returns the results for user for the provided draw
   */
  async getUsersDrawResultsForDrawIds(
    usersAddress: string,
    drawIds: number[],
    maxPicksPerUserPerDraw: number[]
  ): Promise<{ [drawId: number]: DrawResults }> {
    return PrizeApi.getUsersDrawResultsByDraws(
      this.chainId,
      usersAddress,
      this.prizeDistributorMetadata.address,
      drawIds,
      maxPicksPerUserPerDraw
    )
  }

  //////////////////////////// Ethers Contracts Initializers ////////////////////////////

  /**
   * Fetches the address of the DrawCalculator and caches the ethers Contract for the DrawCalculator
   * @returns an ethers Contract for the DrawCalculator related to this PrizeDistributor
   */
  async getDrawCalculatorContract(): Promise<Contract> {
    const {
      drawCalculatorContract
    } = await this.getAndSetDrawCalculatorTimelockAndDrawCalculatorContracts()
    return drawCalculatorContract
  }

  /**
   * Fetches the address of the DrawCalculatorTimelock if there is one and caches the ethers Contract for the DrawCalculatorTimelock.
   * May return undefined if there is no DrawCalculatorTimelock.
   */
  async getDrawCalculatorTimelockContract(): Promise<Contract | undefined> {
    const {
      drawCalculatorTimelockContract
    } = await this.getAndSetDrawCalculatorTimelockAndDrawCalculatorContracts()
    return drawCalculatorTimelockContract
  }

  /**
   * TODO:
   */
  async getAndSetDrawCalculatorTimelockAndDrawCalculatorContracts(): Promise<{
    drawCalculatorContract: Contract
    drawCalculatorTimelockContract: Contract | undefined
  }> {
    if (!!this.drawCalculatorContract) {
      return {
        drawCalculatorContract: this.drawCalculatorContract,
        drawCalculatorTimelockContract: this.drawCalculatorTimelockContract
      }
    }

    let result: Result = await this.prizeDistributorContract.functions.getDrawCalculator()
    let contractAddress = result[0]

    // Check if it's in the contract list, otherwise assume DrawCalculator
    let contractMetadata = this.contractMetadataList.find(
      (contractMetadata) =>
        contractMetadata.chainId === this.chainId && contractMetadata.address === contractAddress
    )
    if (!contractMetadata) {
      throw new Error(`Invalid contract list. Missing ${ContractType.DrawCalculator}.`)
    }

    if (contractMetadata?.type === ContractType.DrawCalculatorTimelock) {
      this.drawCalculatorTimelockMetadata = contractMetadata
      this.drawCalculatorTimelockContract = new Contract(
        this.drawCalculatorTimelockMetadata.address,
        this.drawCalculatorTimelockMetadata.abi,
        this.signerOrProvider
      )
      result = await this.drawCalculatorTimelockContract.functions.getDrawCalculator()

      // Overwrite with actual draw calculator address
      contractAddress = result[0]
      contractMetadata = this.contractMetadataList.find(
        (contractMetadata) =>
          contractMetadata.chainId === this.chainId && contractMetadata.address === contractAddress
      )
      if (!contractMetadata) {
        throw new Error(`Invalid contract list. Missing ${ContractType.DrawCalculator}.`)
      }
    }

    this.drawCalculatorMetadata = contractMetadata
    this.drawCalculatorContract = new Contract(
      this.drawCalculatorMetadata.address,
      this.drawCalculatorMetadata.abi,
      this.signerOrProvider
    )

    return {
      drawCalculatorContract: this.drawCalculatorContract,
      drawCalculatorTimelockContract: this.drawCalculatorTimelockContract
    }
  }

  /**
   * Fetches the address of the PrizeDistributionsBuffer and caches the ethers Contract for the PrizeDistributionsBuffer.
   * @returns an ethers Contract for the PrizeDistributionsBuffer related to this PrizeDistributor
   */
  async getPrizeDistributionsBufferContract(): Promise<Contract> {
    const getAddress = async () => {
      const drawCalculatorContract = await this.getDrawCalculatorContract()
      const result: Result = await drawCalculatorContract.functions.getPrizeDistributionBuffer()
      return result[0]
    }
    return this.getAndSetEthersContract(
      'prizeDistributionsBuffer',
      ContractType.PrizeDistributionBuffer,
      getAddress
    )
  }
}

/**
 * Utility function to create several PrizeDistributors from a contract list.
 * @param contractList a list of all of the relevant contract metadata for all of the PrizeDistributors to create
 * @param signersOrProviders signers or providers for all of the networks the PrizeDistributors are deployed on keyed by the chain id
 * @returns a list of PrizeDistributors
 */
export function initializeV1PrizeDistributors(
  contractList: ContractList,
  signersOrProviders: SignersOrProviders
) {
  const prizeDistributorContracts = contractList.contracts.filter(
    (contract) =>
      contract.type === ContractType.PrizeDistributor && Number(contract.version.major) === 1
  )
  return prizeDistributorContracts.map(
    (prizeDistributorContract) =>
      new PrizeDistributorV1(
        prizeDistributorContract,
        signersOrProviders[prizeDistributorContract.chainId],
        contractList.contracts
      )
  )
}
