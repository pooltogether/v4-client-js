import { Result } from '@ethersproject/abi'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { Contract, Overrides } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { encodeWinningPicks } from '@pooltogether/v4-utils-js'
import { BigNumber, ethers } from 'ethers'

import ERC20Abi from './abis/ERC20Abi'
import { ContractType } from './constants'
import { ContractWrapper } from './ContractWrapper'
import { GaugeController } from './GaugeController'
import { PrizeApi } from './PrizeApi'
import {
  Contract as ContractMetadata,
  ContractList,
  Draw,
  PrizeConfig,
  DrawResults,
  Claim,
  SignersOrProviders,
  TokenData
} from './types'
import {
  createContractMetadata,
  getTokenData,
  validateAddress,
  validateIsSigner,
  validateSignerNetwork
} from './utils'
import { findInContractList } from './utils/findInContractList'

/**
 * A Prize Distributor.
 * Provides access to the contracts for viewing expiration times on draws, timelock timers and checking/claiming prizes for a user. Can be instantiated with an ethers Signer or Provider. Use a Signer if you want to claim transactions for a user. If a provider is provided, only read methods are available.
 */
export class PrizeDistributor extends ContractWrapper {
  private gaugeController: GaugeController | undefined

  // Contract metadata
  readonly prizeDistributorMetadata: ContractMetadata
  drawCalculatorMetadata: ContractMetadata | undefined
  drawBufferMetadata: ContractMetadata | undefined
  drawBeaconMetadata: ContractMetadata | undefined
  tokenMetadata: ContractMetadata | undefined

  // Ethers contracts
  readonly prizeDistributorContract: Contract
  drawCalculatorContract: Contract | undefined
  drawBufferContract: Contract | undefined
  drawBeaconContract: Contract | undefined
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

    const prizeDistributorContract = new Contract(
      prizeDistributorMetadata.address,
      prizeDistributorMetadata.abi,
      signerOrProvider
    )

    // Set metadata
    this.prizeDistributorMetadata = prizeDistributorMetadata

    // Set ethers contracts
    this.prizeDistributorContract = prizeDistributorContract

    // Initialized later - requires a fetch
    this.drawCalculatorMetadata = undefined
    this.drawCalculatorContract = undefined
    this.drawBufferMetadata = undefined
    this.drawBufferContract = undefined
  }

  //////////////////////////// Ethers write functions ////////////////////////////

  /**
   * Fetches a users prizes for the provided draw and submits a transaction to claim them to the Signer.
   * PrizeDistributor must be initialized with a Signer.
   * TODO: NEED TO FUNNEL TICKET ADDRESS TO BE ABLE TO CLAIM PRIZES
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
    const errorPrefix = 'PrizeDistributor [claim] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)

    const drawResults = await this.getUsersDrawResultsForDrawId(
      usersAddress,
      ticketAddress,
      drawId,
      maxPicksPerUser
    )
    return this.claimPrizesByDrawResults(ticketAddress, drawResults, overrides)
  }

  /**
   * Submits a transaction to claim a users prizes
   * PrizeDistributor must be initialized with a Signer.
   * @param drawResults the prize results for a user for a specific draw
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async claimPrizesByDrawResults(
    ticketAddress: string,
    drawResults: DrawResults,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'PrizeDistributor [claimPrizes] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)
    await this.validateSignerNetwork(errorPrefix)

    if (drawResults.totalValue.isZero()) {
      throw new Error(errorPrefix + 'No prizes to claim.')
    }

    const claim: Claim = encodeWinningPicks(usersAddress, ticketAddress, [drawResults])
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
   * Submits a transaction to claim a users prizes across multiple draws
   * PrizeDistributor must be initialized with a Signer.
   * @param drawResults an object of the users draw results to claim keyed by draw ids
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

    const errorPrefix = 'PrizeDistributor [claimPrizes] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)
    await this.validateSignerNetwork(errorPrefix)
    await validateAddress(errorPrefix, ticketAddress)

    const drawResultsList = Object.values(drawResults)
    const totalValueToClaim = drawResultsList.reduce((total, drawResult) => {
      return total.add(drawResult.totalValue)
    }, ethers.BigNumber.from(0))

    if (totalValueToClaim.isZero()) {
      throw new Error(errorPrefix + 'No prizes to claim.')
    }

    const claim: Claim = encodeWinningPicks(usersAddress, ticketAddress, drawResultsList)
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
   * Fetches decimals, name and symbol for the Token that will be distributed.
   * @returns the decimals, name and symbol for the token
   */
  async getTokenData(): Promise<TokenData> {
    const tokenContract = await this.getTokenContract()
    return getTokenData(tokenContract)
  }

  /**
   * Fetches the newest Draw in the DrawBuffer related to the PrizeDistributor.
   * NOTE: Will throw an error if the buffer is empty.
   * @returns the newest draw in the draw buffer
   */
  async getNewestDraw(): Promise<Draw> {
    const drawBufferContract = await this.getDrawBufferContract()
    const result: Result = await drawBufferContract.functions.getNewestDraw()
    const draw = result[0]
    return {
      drawId: draw.drawId,
      timestamp: draw.timestamp,
      winningRandomNumber: draw.winningRandomNumber,
      beaconPeriodStartedAt: draw.beaconPeriodStartedAt,
      beaconPeriodSeconds: draw.beaconPeriodSeconds
    }
  }

  /**
   * Fetches the oldest Draw in the DrawBuffer related to the PrizeDistributor.
   * @returns the oldest draw in the draw buffer
   */
  async getOldestDraw(): Promise<Draw> {
    const drawBufferContract = await this.getDrawBufferContract()
    const result: Result = await drawBufferContract.functions.getOldestDraw()
    const draw = result[0]
    return {
      drawId: draw.drawId,
      timestamp: draw.timestamp,
      winningRandomNumber: draw.winningRandomNumber,
      beaconPeriodStartedAt: draw.beaconPeriodStartedAt,
      beaconPeriodSeconds: draw.beaconPeriodSeconds
    }
  }

  /**
   * Fetches the range of draw ids that are available in the DrawBuffer.
   * @returns a list of draw ids in the buffer
   */
  async getDrawIdsFromDrawBuffer(): Promise<number[]> {
    const [oldestDrawResponse, newestDrawResponse] = await Promise.allSettled([
      this.getOldestDraw(),
      this.getNewestDraw()
    ])

    if (newestDrawResponse.status === 'rejected' || oldestDrawResponse.status === 'rejected') {
      return []
    }

    const oldestId = oldestDrawResponse.value.drawId
    const newestId = newestDrawResponse.value.drawId

    const drawIds = []
    for (let i = oldestId; i <= newestId; i++) {
      drawIds.push(i)
    }

    return drawIds
  }

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
   * Fetches a Draw from the DrawBuffer.
   * @param drawId the draw id of the Draw to fetch
   * @returns the Draw
   */
  async getDraw(drawId: number): Promise<Draw> {
    const drawBufferContract = await this.getDrawBufferContract()
    const response: Result = await drawBufferContract.functions.getDraw(drawId)
    return {
      drawId: response[0].drawId,
      timestamp: response[0].timestamp,
      winningRandomNumber: response[0].winningRandomNumber,
      beaconPeriodStartedAt: response[0].beaconPeriodStartedAt,
      beaconPeriodSeconds: response[0].beaconPeriodSeconds
    }
  }

  /**
   * Fetches multiple Draws from the DrawBuffer.
   * @param drawIds a list of draw ids to fetch
   * @returns an object with Draws keyed by their draw ids
   */
  async getDraws(drawIds: number[]): Promise<{ [drawId: number]: Draw }> {
    const draws: { [drawId: number]: Draw } = {}
    if (!drawIds || drawIds.length === 0) {
      return draws
    }
    const drawBufferContract = await this.getDrawBufferContract()
    const response: Result = await drawBufferContract.functions.getDraws(drawIds)
    response[0].forEach((draw: Draw) => {
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
      poolStakeTotal: result[0].poolStakeTotal
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
        poolStakeTotal: result.poolStakeTotal
      }
    })
    return prizeConfigs
  }

  /**
   * Fetches the amount of tokens a user claimed for a draw.
   * @param usersAddress the address of the user to check
   * @param drawId the draw id to check
   * @returns the amount a user claimed
   */
  async getUsersClaimedAmount(usersAddress: string, drawId: number): Promise<BigNumber> {
    const errorPrefix = 'PrizeDistributor [getUsersClaimedAmount] |'
    await validateAddress(errorPrefix, usersAddress)

    const result: Result = await this.prizeDistributorContract.functions.getDrawPayoutBalanceOf(
      usersAddress,
      drawId
    )
    return result[0]
  }

  /**
   * Fetches the amount of tokens a user claimed for multiple draws.
   * @param usersAddress the address of the user to check
   * @param drawIds a list of draw ids to check
   * @returns an object of claimed amounts keyed by the draw ids
   */
  async getUsersClaimedAmounts(
    usersAddress: string,
    drawIds: number[]
  ): Promise<{ [drawId: number]: BigNumber }> {
    const claimedAmounts: { [drawId: number]: BigNumber } = {}
    await Promise.all(
      drawIds.map((drawId) => {
        return this.getUsersClaimedAmount(usersAddress, drawId).then((claimedAmount) => {
          claimedAmounts[drawId] = claimedAmount
        })
      })
    )
    return claimedAmounts
  }

  /**
   * Fetches a users pick count for several draw ids.
   * @param usersAddress the address of a user to fetch pick counts for
   * @param ticketAddress the address of the ticket identifying the prize pool
   * @param drawIds a list of draw ids to fetch pick counts for
   * @returns an object of pick counts keyed by draw ids
   */
  async getUsersPickCountForDrawIds(
    usersAddress: string,
    ticketAddress: string,
    drawIds: number[]
  ): Promise<{ [drawId: number]: BigNumber }> {
    const errorPrefix = 'PrizeDistributor [getUsersPickCountForDrawIds] |'
    await validateAddress(errorPrefix, usersAddress)

    const drawCalculatorContract = await this.getDrawCalculatorContract()
    const result: Result = await drawCalculatorContract.functions.calculateUserPicks(
      ticketAddress,
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
    ticketAddress: string,
    drawId: number,
    maxPicksPerUser: number
  ): Promise<DrawResults> {
    return PrizeApi.getUsersDrawResultsByDraw(
      this.chainId,
      usersAddress,
      ticketAddress,
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
    ticketAddress: string,
    drawIds: number[],
    maxPicksPerUserPerDraw: number[]
  ): Promise<{ [drawId: number]: DrawResults }> {
    return PrizeApi.getUsersDrawResultsByDraws(
      this.chainId,
      usersAddress,
      ticketAddress,
      this.prizeDistributorMetadata.address,
      drawIds,
      maxPicksPerUserPerDraw
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

  //////////////////////////// Ethers Contracts Initializers ////////////////////////////

  /**
   * Fetches the address of the DrawCalculator and caches the ethers Contract for the DrawCalculator
   * @returns an ethers Contract for the DrawCalculator related to this PrizeDistributor
   */
  async getGaugeController(): Promise<GaugeController> {
    const errorPrefix = 'PrizeDistributor [getGaugeController] | '
    if (this.gaugeController) return this.gaugeController
    const drawCalculatorContract = await this.getDrawCalculatorContract()
    const result: Result = await drawCalculatorContract.functions.gaugeController()
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
   * @returns an ethers Contract for the DrawCalculator related to this PrizeDistributor
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
   * @returns an ethers Contract for the DrawBuffer related to this PrizeDistributor
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
   * Fetches the address of the DrawBeacon and caches the ethers Contract for the DrawBeacon.
   * @returns an ethers Contract for the DrawBeacon related to this PrizeDistributor
   */
  async getDrawBeaconContract(): Promise<Contract> {
    const getAddress = async () => {
      const drawBufferContract = await this.getDrawBufferContract()
      const result: Result = await drawBufferContract.functions.manager()
      return result[0]
    }
    return this.getAndSetEthersContract('drawBeacon', ContractType.DrawBeacon, getAddress)
  }

  /**
   * Fetches the address of the PrizeConfigHistory and caches the ethers Contract for the PrizeConfigHistory.
   * @returns an ethers Contract for the PrizeConfigHistory related to this PrizeDistributor
   */
  async getPrizeConfigHistoryContract(): Promise<Contract> {
    const getAddress = async () => {
      const drawCalculatorContract = await this.getDrawCalculatorContract()
      const result: Result = await drawCalculatorContract.functions.prizeConfigHistory()
      return result[0]
    }
    return this.getAndSetEthersContract(
      'prizeConfigHistory',
      ContractType.PrizeConfigHistory,
      getAddress
    )
  }

  /**
   * Fetches the address of the Token that is distributed by this PrizeDistributor and caches the ethers Contract for the ERC20 Token.
   * @returns an ethers Contract for the ERC20 Token related to this PrizeDistributor
   */
  async getTokenContract(): Promise<Contract> {
    if (this.tokenContract !== undefined) return this.tokenContract
    const getAddress = async () => {
      const result: Result = await this.prizeDistributorContract.functions.getToken()
      return result[0]
    }
    const tokenAddress = await getAddress()
    const tokenMetadata = createContractMetadata(
      this.chainId,
      tokenAddress,
      ContractType.Token,
      ERC20Abi
    )
    const tokenContract = new Contract(
      tokenMetadata.address,
      tokenMetadata.abi,
      this.signerOrProvider
    )
    this.tokenMetadata = tokenMetadata
    this.tokenContract = tokenContract
    return tokenContract
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

  //////////////////////////// Methods ////////////////////////////

  /**
   * Returns the users address of the provided Signer.
   * PrizeDistributor can be initialized with a Signer.
   * @param errorPrefix the class and function name of where the error occurred
   * @returns the address of the user
   */
  async getUsersAddress(errorPrefix = 'PrizeDistributor [getUsersAddress] |') {
    await this.validateIsSigner(errorPrefix)
    return await (this.signerOrProvider as Signer).getAddress()
  }

  //////////////////////////// Validation methods ////////////////////////////

  /**
   * Validates that a Signer is on the network the PrizeDistributor is deployed on.
   * @param errorPrefix the class and function name of where the error occurred
   */
  async validateSignerNetwork(errorPrefix: string) {
    validateSignerNetwork(errorPrefix, this.signerOrProvider as Signer, this.chainId)
  }

  /**
   * Validates that the data provided for providerOrSigner is a Signer.
   * @param errorPrefix the class and function name of where the error occurred
   */
  async validateIsSigner(errorPrefix: string) {
    validateIsSigner(errorPrefix, this.signerOrProvider)
  }
}

/**
 * Utility function to create several PrizeDistributors from a contract list.
 * @param contractList a list of all of the relevant contract metadata for all of the PrizeDistributors to create
 * @param signersOrProviders signers or providers for all of the networks the PrizeDistributors are deployed on keyed by the chain id
 * @returns a list of PrizeDistributors
 */
export function initializePrizeDistributors(
  contractList: ContractList,
  signersOrProviders: SignersOrProviders
) {
  const prizeDistributorContracts = contractList.contracts.filter(
    (contract) => contract.type === ContractType.PrizeDistributor
  )
  return prizeDistributorContracts.map(
    (prizeDistributorContract) =>
      new PrizeDistributor(
        prizeDistributorContract,
        signersOrProviders[prizeDistributorContract.chainId],
        contractList.contracts
      )
  )
}
