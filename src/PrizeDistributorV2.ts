import { Result } from '@ethersproject/abi'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { Contract, Overrides } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { encodeWinningPicks } from '@pooltogether/v4-utils-js'
import { BigNumber, ethers } from 'ethers'

import { ContractType } from './constants'
import { GaugeController } from './GaugeController'
import { PrizeApi } from './PrizeApi'
import { PrizeDistributor } from './PrizeDistributor'
import {
  Contract as ContractMetadata,
  ContractList,
  Draw,
  PrizeConfig,
  DrawResults,
  Claim,
  SignersOrProviders
} from './types'
import { validateAddress } from './utils'
import { findInContractList } from './utils/findInContractList'

/**
 * A V2 Prize Distributor.
 * Provides access to the contracts for viewing expiration times on draws, timelock timers and checking/claiming prizes for a user. Can be instantiated with an ethers Signer or Provider. Use a Signer if you want to claim transactions for a user. If a provider is provided, only read methods are available.
 */
export class PrizeDistributorV2 extends PrizeDistributor {
  private gaugeController: GaugeController | undefined

  // Contract metadata
  readonly prizeDistributorMetadata: ContractMetadata
  drawCalculatorMetadata: ContractMetadata | undefined
  drawBeaconMetadata: ContractMetadata | undefined
  tokenMetadata: ContractMetadata | undefined

  // Ethers contracts
  readonly prizeDistributorContract: Contract
  drawCalculatorContract: Contract | undefined
  drawBeaconContract: Contract | undefined
  tokenContract: Contract | undefined

  /**
   * Create an instance of a PrizeDistributorV2 by providing the metadata of the PrizeDistributorV2 contract, an ethers Provider or Signer for the network the PrizeDistributorV2 contract is deployed on and a list of contract metadata for the other contracts that make up the PrizeDistributorV2.
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

    const prizeDistributorContract = new Contract(
      prizeDistributorMetadata.address,
      prizeDistributorMetadata.abi,
      signerOrProvider
    )

    // Set metadata
    this.prizeDistributorMetadata = prizeDistributorMetadata

    // Set ethers contracts
    this.prizeDistributorContract = prizeDistributorContract
  }

  //////////////////////////// Ethers write functions ////////////////////////////

  /**
   * Fetches a user prizes for the provided draw and submits a transaction to claim them to the Signer.
   * PrizeDistributorV2 must be initialized with a Signer.
   * @param drawId the draw id to claim prizes for
   * @param maxPicksPerUser the maximum picks per user from the PrizeConfig for the provided draw id
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async claimPrizesByDraw(
    ticketAddress: string,
    drawId: number,
    maxPicksPerUser: number,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'PrizeDistributorV2 [claim] | '
    const userAddress = await this.getUserAddress(errorPrefix)

    const drawResults = await this.getUserDrawResultsForDrawId(
      userAddress,
      ticketAddress,
      drawId,
      maxPicksPerUser
    )
    return this.claimPrizesByDrawResults(ticketAddress, drawResults, overrides)
  }

  /**
   * Submits a transaction to claim a user prizes
   * PrizeDistributorV2 must be initialized with a Signer.
   * @param drawResults the prize results for a user for a specific draw
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async claimPrizesByDrawResults(
    ticketAddress: string,
    drawResults: DrawResults,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'PrizeDistributorV2 [claimPrizes] | '
    const userAddress = await this.getUserAddress(errorPrefix)
    await this.validateSignerNetwork(errorPrefix)

    if (drawResults.totalValue.isZero()) {
      throw new Error(errorPrefix + 'No prizes to claim.')
    }

    const claim: Claim = encodeWinningPicks(userAddress, [drawResults], ticketAddress)
    if (Boolean(overrides)) {
      return this.prizeDistributorContract.claim(
        claim.ticketAddress,
        claim.userAddress,
        claim.drawIds,
        claim.encodedWinningPickIndices,
        overrides
      )
    } else {
      return this.prizeDistributorContract.claim(
        claim.ticketAddress,
        claim.userAddress,
        claim.drawIds,
        claim.encodedWinningPickIndices
      )
    }
  }

  /**
   * Submits a transaction to claim a user prizes across multiple draws
   * PrizeDistributorV2 must be initialized with a Signer.
   * @param drawResults an object of the user draw results to claim keyed by draw ids
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async claimPrizesAcrossMultipleDrawsByDrawResults(
    ticketAddress: string,
    drawResults: {
      [drawId: number]: DrawResults
    },
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    console.log({ ticketAddress, drawResults })

    const errorPrefix = 'PrizeDistributorV2 [claimPrizes] | '
    const userAddress = await this.getUserAddress(errorPrefix)
    await this.validateSignerNetwork(errorPrefix)
    await validateAddress(errorPrefix, ticketAddress)

    const drawResultsList = Object.values(drawResults)
    const totalValueToClaim = drawResultsList.reduce((total, drawResult) => {
      return total.add(drawResult.totalValue)
    }, ethers.BigNumber.from(0))

    if (totalValueToClaim.isZero()) {
      throw new Error(errorPrefix + 'No prizes to claim.')
    }

    const claim: Claim = encodeWinningPicks(userAddress, drawResultsList, ticketAddress)
    if (Boolean(overrides)) {
      return this.prizeDistributorContract.claim(
        claim.ticketAddress,
        claim.userAddress,
        claim.drawIds,
        claim.encodedWinningPickIndices,
        overrides
      )
    } else {
      return this.prizeDistributorContract.claim(
        claim.ticketAddress,
        claim.userAddress,
        claim.drawIds,
        claim.encodedWinningPickIndices
      )
    }
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  /**
   * Gets the list of draw ids of draws that have are available in both the DrawBuffer and PrizeConfigBuffer.
   * @returns a list of draw ids in both buffers
   */
  async getAvailableDrawIds(): Promise<number[]> {
    const [oldestDrawResponse, newestDrawResponse] = await Promise.allSettled([
      this.getOldestDraw(),
      this.getNewestDraw()
    ])
    // If newest failed, there are none
    // TODO: Check oldest for id 0 as well
    // TODO: Do the same empty states apply for the prize distribution buffer?
    if (newestDrawResponse.status === 'rejected' || oldestDrawResponse.status === 'rejected') {
      return []
    }

    const oldestDrawId = oldestDrawResponse.value.drawId
    const newestDrawId = newestDrawResponse.value.drawId

    if (newestDrawId < oldestDrawId) return []

    const validIds = []
    for (let i = oldestDrawId; i <= newestDrawId; i++) {
      validIds.push(i)
    }
    return validIds
  }

  /**
   * Fetches Draws and PrizeConfigs from their respective buffers for the provided list of draw ids.
   * @param drawIds the list of draw ids to fetch Draws and PrizeConfigs for
   * @returns an object full of Draws and PrizeConfigs keyed by their draw id
   */
  async getDrawsAndPrizeConfigs(
    drawIds: number[]
  ): Promise<{ [drawId: number]: { draw: Draw; prizeConfig: PrizeConfig } }> {
    const [drawsResponse, prizeConfigsResponse] = await Promise.allSettled([
      this.getDraws(drawIds),
      this.getPrizeConfigs(drawIds)
    ])

    // If any are rejected, drop the largest draw id and retry
    // TODO: Make this error handling better.
    // There's a delay between setting the draw and the prize distribution so this will happen frequently.
    if (drawsResponse.status === 'rejected' || prizeConfigsResponse.status === 'rejected') {
      return this.getDrawsAndPrizeConfigs(
        drawIds.sort((a, b) => a - b).slice(0, drawIds.length - 1)
      )
    }

    const drawsAndPrizeConfigs: {
      [drawId: number]: { draw: Draw; prizeConfig: PrizeConfig }
    } = {}
    Object.values(drawsResponse.value).forEach((draw, index) => {
      drawsAndPrizeConfigs[draw.drawId] = {
        draw,
        prizeConfig: prizeConfigsResponse.value[index]
      }
    })

    return drawsAndPrizeConfigs
  }

  /**
   * Fetches a PrizeConfig from the PrizeConfigBuffer.
   * @param drawId the draw id for the PrizeConfig to fetch
   * @returns the PrizeConfig
   */
  async getPrizeConfig(drawId: number): Promise<PrizeConfig> {
    const prizeConfigHistoryContract = await this.getPrizeConfigHistoryContract()
    const result: Result = await prizeConfigHistoryContract.functions.getPrizeConfig(drawId)
    return {
      matchCardinality: result[0].matchCardinality,
      tiers: result[0].tiers,
      bitRangeSize: result[0].bitRangeSize,
      maxPicksPerUser: result[0].maxPicksPerUser,
      expiryDuration: result[0].expiryDuration,
      prize: result[0].prize,
      endTimestampOffset: result[0].drawEndTimestampOffset,
      drawId: result[0].drawId,
      poolStakeCeiling: result[0].poolStakeCeiling
    }
  }

  /**
   * Fetches multiple PrizeConfigs from the PrizeConfigBuffer.
   * @param drawIds a list of draw ids to fetch PrizeConfigs for
   * @returns an object with PrizeConfigs keyed by draw ids
   */
  async getPrizeConfigs(drawIds: number[]): Promise<{ [drawId: number]: PrizeConfig }> {
    if (!drawIds || drawIds.length === 0) {
      return {}
    }
    const prizeConfigHistoryContract = await this.getPrizeConfigHistoryContract()
    const prizeConfigResults: Result = await prizeConfigHistoryContract.functions.getPrizeConfigList(
      drawIds
    )
    const prizeConfigs: { [drawId: number]: PrizeConfig } = {}
    prizeConfigResults[0].forEach((result: PrizeConfig, index: number) => {
      prizeConfigs[drawIds[index]] = {
        matchCardinality: result.matchCardinality,
        tiers: result.tiers,
        bitRangeSize: result.bitRangeSize,
        maxPicksPerUser: result.maxPicksPerUser,
        prize: result.prize,
        expiryDuration: result.expiryDuration,
        endTimestampOffset: result.endTimestampOffset,
        drawId: result.drawId,
        poolStakeCeiling: result.poolStakeCeiling
      }
    })
    return prizeConfigs
  }

  /**
   * Fetches a user pick count for several draw ids.
   * @param userAddress the address of a user to fetch pick counts for
   * @param ticketAddress the address of the ticket identifying the prize pool
   * @param drawIds a list of draw ids to fetch pick counts for
   * @returns an object of pick counts keyed by draw ids
   */
  async getUserPickCountForDrawIds(
    userAddress: string,
    ticketAddress: string,
    drawIds: number[]
  ): Promise<{ [drawId: number]: BigNumber }> {
    const errorPrefix = 'PrizeDistributorV2 [getUserPickCountForDrawIds] |'
    await validateAddress(errorPrefix, userAddress)

    const drawCalculatorContract = await this.getDrawCalculatorContract()
    console.log({ drawCalculatorContract, ticketAddress, userAddress, drawIds })
    const result: Result = await drawCalculatorContract.functions.calculateUserPicks(
      ticketAddress,
      userAddress,
      drawIds
    )
    return result[0]
  }

  /**
   * Fetches the claimable prizes a user won for a specific Draw.
   * @param userAddress the user address to fetch prizes for
   * @param drawId the draw id to fetch prizes for
   * @param maxPicksPerUser the maximum number of picks per user from the matching prize distribution
   * @returns the results for user for the provided draw
   */
  async getUserDrawResultsForDrawId(
    userAddress: string,
    ticketAddress: string,
    drawId: number,
    maxPicksPerUser: number
  ): Promise<DrawResults> {
    return PrizeApi.getUserDrawResultsByDraw(
      this.chainId,
      userAddress,
      this.prizeDistributorMetadata.address,
      drawId,
      maxPicksPerUser,
      ticketAddress
    )
  }

  /**
   * Fetches the claimable prizes a user won for multiple Draws.
   * @param userAddress the user address to fetch prizes for
   * @param drawIds the draw ids to fetch prizes for
   * @param maxPicksPerUserPerDraw the maximum number of picks per user from the matching prize distribution for each draw
   * @returns the results for user for the provided draw
   */
  async getUserDrawResultsForDrawIds(
    userAddress: string,
    ticketAddress: string,
    drawIds: number[],
    maxPicksPerUserPerDraw: number[]
  ): Promise<{ [drawId: number]: DrawResults }> {
    return PrizeApi.getUserDrawResultsByDraws(
      this.chainId,
      userAddress,
      this.prizeDistributorMetadata.address,
      drawIds,
      maxPicksPerUserPerDraw,
      ticketAddress
    )
  }

  /**
   * Fetch the current Draw Beacon period data from the beacon Prize Pool.
   * @returns the current draw beacon period.
   */
  async getDrawBeaconPeriod() {
    const drawBeaconContract = await this.getDrawBeaconContract()
    const [periodSecondsResult, periodStartedAtResult, nextDrawIdResult] = await Promise.all([
      drawBeaconContract.functions.getBeaconPeriodSeconds(),
      drawBeaconContract.functions.getBeaconPeriodStartedAt(),
      drawBeaconContract.functions.getNextDrawId()
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
   * Fetches the upcoming prize tier data from the prize tier history contract. This data is used for the next prize distribution that will be added to the Prize Distribution Buffer for the beacon Prize Pool.
   * @returns the upcoming prize tier
   */
  async getUpcomingPrizeConfig(): Promise<PrizeConfig> {
    const prizeConfigHistoryContract = await this.getPrizeConfigHistoryContract()
    let drawId: number = 0
    try {
      drawId = await prizeConfigHistoryContract.functions.getNewestDrawId()
    } catch (e) {
      console.log(`Error fetching newest draw id on ${prizeConfigHistoryContract.address}`, { e })
    }
    return this.getPrizeConfig(drawId + 1)
  }

  //////////////////////////// Contract Getters ////////////////////////////

  /**
   * Fetches the address of the DrawCalculator and caches the ethers Contract for the DrawCalculator
   * @returns an ethers Contract for the DrawCalculator related to this PrizeDistributorV2
   */
  async getGaugeController(): Promise<GaugeController> {
    const errorPrefix = 'PrizeDistributorV2 [getGaugeController] | '
    if (this.gaugeController) return this.gaugeController
    const drawCalculatorContract = await this.getDrawCalculatorContract()
    console.log(drawCalculatorContract)
    const result: Result = await drawCalculatorContract.functions.getGaugeController()
    const metadata = findInContractList(this.contractMetadataList, this.chainId, result[0])
    if (!metadata) {
      throw new Error(errorPrefix + ` GaugeController metadata not provided`)
    }
    this.gaugeController = new GaugeController(
      metadata,
      this.signerOrProvider,
      this.contractMetadataList
    )
    return this.gaugeController
  }

  /**
   * Fetches the address of the DrawCalculator and caches the ethers Contract for the DrawCalculator
   * @returns an ethers Contract for the DrawCalculator related to this PrizeDistributorV2
   */
  async getDrawCalculatorContract(): Promise<Contract> {
    const getAddress = async () => {
      let result: Result = await this.prizeDistributorContract.functions.getDrawCalculator()
      return result[0]
    }
    return this.getAndSetEthersContract('drawCalculator', ContractType.DrawCalculator, getAddress)
  }

  /**
   * Fetches the address of the DrawBuffer and caches the ethers Contract for the DrawBuffer.
   * @returns an ethers Contract for the DrawBuffer related to this PrizeDistributorV2
   */
  async getDrawBufferContract(): Promise<Contract> {
    const getAddress = async () => {
      const drawCalculatorContract = await this.getDrawCalculatorContract()
      const result: Result = await drawCalculatorContract.functions.getDrawBuffer()
      return result[0]
    }
    return this.getAndSetEthersContract('drawBuffer', ContractType.DrawBuffer, getAddress)
  }

  /**
   * Fetches the address of the PrizeConfigHistory and caches the ethers Contract for the PrizeConfigHistory.
   * @returns an ethers Contract for the PrizeConfigHistory related to this PrizeDistributorV2
   */
  async getPrizeConfigHistoryContract(): Promise<Contract> {
    const getAddress = async () => {
      const drawCalculatorContract = await this.getDrawCalculatorContract()
      const result: Result = await drawCalculatorContract.functions.getPrizeConfigHistory()
      return result[0]
    }
    return this.getAndSetEthersContract(
      'prizeConfigHistory',
      ContractType.PrizeConfigHistory,
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
export function initializeV2PrizeDistributors(
  contractList: ContractList,
  signersOrProviders: SignersOrProviders
) {
  const prizeDistributorContracts = contractList.contracts.filter(
    (contract) =>
      contract.type === ContractType.PrizeDistributor && Number(contract.version.major) === 2
  )
  return prizeDistributorContracts.map(
    (prizeDistributorContract) =>
      new PrizeDistributorV2(
        prizeDistributorContract,
        signersOrProviders[prizeDistributorContract.chainId],
        contractList.contracts
      )
  )
}
