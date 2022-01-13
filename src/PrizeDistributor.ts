import { Result } from '@ethersproject/abi'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { Contract, Overrides } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import {
  prepareClaims,
  calculateDrawResults,
  filterResultsByValue
} from '@pooltogether/draw-calculator-js'
import { BigNumber, ethers } from 'ethers'

import ERC20Abi from './abis/ERC20Abi'
import { ContractType } from './constants'
import {
  Contract as ContractMetadata,
  ContractList,
  Draw,
  PrizeDistribution,
  DrawResults,
  Claim,
  DrawCalcUser,
  SignersOrProviders,
  TokenData
} from './types'
import {
  createContractMetadata,
  getMetadataAndContract,
  getTokenData,
  validateAddress,
  validateIsSigner,
  validateSignerNetwork
} from './utils'

/**
 * A Prize Distributor.
 * Provides access to the contracts for viewing expiration times on draws, timelock timers and checking/claiming prizes for a user. Can be instantiated with an ethers Signer or Provider. Use a Signer if you want to claim transactions for a user. If a provider is provided, only read methods are available.
 */
export class PrizeDistributor {
  readonly contractMetadataList: ContractMetadata[]
  readonly signerOrProvider: Provider | Signer
  readonly chainId: number
  readonly address: string

  // Contract metadata
  readonly prizeDistributorMetadata: ContractMetadata
  readonly drawCalculatorTimelockMetadata: ContractMetadata
  drawCalculatorMetadata: ContractMetadata | undefined
  drawBufferMetadata: ContractMetadata | undefined
  prizeDistributionsBufferMetadata: ContractMetadata | undefined
  tokenMetadata: ContractMetadata | undefined

  // Ethers contracts
  readonly prizeDistributorContract: Contract
  readonly drawCalculatorTimelockContract: Contract
  drawCalculatorContract: Contract | undefined
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
    // Get contract metadata & ethers contracts
    const {
      contractMetadata: drawCalculatorTimelockMetadata,
      contract: drawCalculatorTimelockContract
    } = getMetadataAndContract(
      prizeDistributorMetadata.chainId,
      signerOrProvider,
      ContractType.DrawCalculatorTimelock,
      contractMetadataList
    )

    const prizeDistributorContract = new Contract(
      prizeDistributorMetadata.address,
      prizeDistributorMetadata.abi,
      signerOrProvider
    )

    // Set data
    this.signerOrProvider = signerOrProvider
    this.contractMetadataList = contractMetadataList
    this.chainId = prizeDistributorMetadata.chainId
    this.address = prizeDistributorMetadata.address

    // Set metadata
    this.prizeDistributorMetadata = prizeDistributorMetadata
    this.drawCalculatorTimelockMetadata = drawCalculatorTimelockMetadata

    // Set ethers contracts
    this.prizeDistributorContract = prizeDistributorContract
    this.drawCalculatorTimelockContract = drawCalculatorTimelockContract

    // Initialized later - requires a fetch
    this.drawCalculatorMetadata = undefined
    this.drawCalculatorContract = undefined
    this.drawBufferMetadata = undefined
    this.drawBufferContract = undefined
    this.prizeDistributionsBufferMetadata = undefined
    this.prizeDistributionsBufferContract = undefined
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
   * @param draw the draw to claim prizes for
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async claimPrizesByDraw(draw: Draw, overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'PrizeDistributors [claim] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)

    const drawResults = await this.calculateUsersPrizes(usersAddress, draw)
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
    const errorPrefix = 'PrizeDistributors [claimPrizes] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)
    await this.validateSignerNetwork(errorPrefix)

    if (drawResults.totalValue.isZero()) {
      throw new Error(errorPrefix + 'No prizes to claim.')
    }

    const claim: Claim = prepareClaims({ address: usersAddress } as DrawCalcUser, [drawResults])
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
    const errorPrefix = 'PrizeDistributors [claimPrizes] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)
    await this.validateSignerNetwork(errorPrefix)

    const drawResultsList = Object.values(drawResults)
    const totalValueToClaim = drawResultsList.reduce((total, drawResult) => {
      return total.add(drawResult.totalValue)
    }, ethers.BigNumber.from(0))

    if (totalValueToClaim.isZero()) {
      throw new Error(errorPrefix + 'No prizes to claim.')
    }

    const claim: Claim = prepareClaims({ address: usersAddress } as DrawCalcUser, drawResultsList)
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
  //   const errorPrefix = 'PrizeDistributors [getClaimedEvents] |'
  //   const usersAddress = await this.getUsersAddress(errorPrefix)

  //   return this.getUsersClaimedEvents(usersAddress)
  // }

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
        drawStartTimestampOffset: prizeDistribution.drawStartTimestampOffset,
        drawEndTimestampOffset: prizeDistribution.drawEndTimestampOffset,
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
        drawStartTimestampOffset: prizeDistribution.drawStartTimestampOffset,
        drawEndTimestampOffset: prizeDistribution.drawEndTimestampOffset,
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
    const timelockResult = await this.drawCalculatorTimelockContract.functions.getTimelock()
    const [endTimeSeconds, drawId] = timelockResult[0]
    return {
      drawId,
      endTimeSeconds
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
      prize: result[0].prize,
      drawStartTimestampOffset: result[0].drawStartTimestampOffset,
      drawEndTimestampOffset: result[0].drawEndTimestampOffset
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
        drawStartTimestampOffset: result.drawStartTimestampOffset,
        drawEndTimestampOffset: result.drawEndTimestampOffset
      }
    })
    return prizeDistributions
  }

  /**
   * Fetches the amount of tokens a user claimed for a draw.
   * @param usersAddress the address of the user to check
   * @param drawId the draw id to check
   * @returns the amount a user claimed
   */
  async getUsersClaimedAmount(usersAddress: string, drawId: number): Promise<BigNumber> {
    const errorPrefix = 'PrizeDistributors [getUsersClaimedAmount] |'
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
   * Fetches a users normalized balance for several draw ids.
   * @param usersAddress the address of a user to fetch normalized balances for
   * @param drawIds a list of draw ids to fetch normalized balances for
   * @returns an object of normalized balances keyed by draw ids
   */
  async getUsersNormalizedBalancesForDrawIds(
    usersAddress: string,
    drawIds: number[]
  ): Promise<{ [drawId: number]: BigNumber }> {
    const errorPrefix = 'PrizeDistributors [getUsersNormalizedBalancesForDrawIds] |'
    await validateAddress(errorPrefix, usersAddress)

    const drawCalculatorContract = await this.getDrawCalculatorContract()
    const result: Result = await drawCalculatorContract.functions.getNormalizedBalancesForDrawIds(
      usersAddress,
      drawIds
    )
    return result[0]
  }

  /**
   * Calculates the prizes a user won for a specific Draw.
   * NOTE: This is computationally expensive and may cause a long delay. It is not recommended to run this on a clients device.
   * @param usersAddress the users address to compute prizes for
   * @param draw the draw to compute prizes for
   * @returns the results for user for the provided draw
   */
  async calculateUsersPrizes(usersAddress: string, draw: Draw): Promise<DrawResults> {
    // Fetch the draw settings for the draw
    const prizeDistribution: PrizeDistribution = await this.getPrizeDistribution(draw.drawId)

    // Fetch users normalized balance
    const drawCalculatorContract = await this.getDrawCalculatorContract()
    const balanceResult = await drawCalculatorContract.functions.getNormalizedBalancesForDrawIds(
      usersAddress,
      [draw.drawId]
    )

    const normalizedBalance: BigNumber = balanceResult[0][0]

    const user: DrawCalcUser = {
      address: usersAddress,
      normalizedBalances: [normalizedBalance]
    }

    if (normalizedBalance.isZero()) {
      return {
        drawId: draw.drawId,
        totalValue: ethers.constants.Zero,
        prizes: []
      }
    } else {
      const drawResults = calculateDrawResults(
        prizeDistribution,
        {
          ...draw,
          timestamp: draw.timestamp.toNumber(),
          beaconPeriodStartedAt: draw.beaconPeriodStartedAt.toNumber()
        },
        user
      )
      return filterResultsByValue(drawResults, prizeDistribution.maxPicksPerUser)
    }
  }

  /**
   * Fetches Draw data and calculates the prizes a user won for a specific draw id.
   * NOTE: This is computationally expensive and may cause a long delay. It is not recommended to run this on a clients device.
   * @param usersAddress the users address to compute prizes for
   * @param drawId the draw id for fetch and compute prizes for
   * @returns the results for user for the provided draw id
   */
  async calculateUsersPrizesByDrawId(usersAddress: string, drawId: number): Promise<DrawResults> {
    const draw = await this.getDraw(drawId)
    return this.calculateUsersPrizes(usersAddress, draw)
  }

  // NOTE: Claimed event functions commented out as events on networks other than Ethereum mainnet are unreliable.

  /**
   *
   * @param usersAddress
   * @returns
   */
  // async getUsersClaimedEvents(usersAddress: string) {
  //   const errorPrefix = 'PrizeDistributors [getUsersClaimedEvents] |'
  //   await validateAddress(errorPrefix, usersAddress)

  //   const eventFilter = this.prizeDistributorContract.filters.ClaimedDraw(usersAddress)
  //   return await this.prizeDistributorContract.queryFilter(eventFilter)
  // }

  /**
   *
   * @param usersAddress
   * @param draw
   * @returns
   */
  // async getUsersClaimedEvent(usersAddress: string, draw: Draw): Promise<Event> {
  //   const eventFilter = this.prizeDistributorContract.filters.ClaimedDraw(usersAddress, draw.drawId)
  //   const events = await this.prizeDistributorContract.queryFilter(eventFilter)
  //   return events[0]
  // }

  //////////////////////////// Ethers Contracts Initializers ////////////////////////////

  /**
   * Fetches a contract address, finds the relevant metadata in the ContractList and creates an ethers Contract for that contract. The ethers Contract is cached on the instance of the PrizeDistributor and is returned immediately if already stored.
   * @param key the key for the requested contract to be stored on the PrizeDistributor
   * @param contractType the contract name
   * @param getContractAddress a function to fetch the contract address
   * @returns an ethers Contract for the provided address and contract type
   */
  private async getAndSetEthersContract(
    key: string,
    contractType: ContractType,
    getContractAddress: () => Promise<string>
  ): Promise<Contract> {
    const contractKey = `${key}Contract`
    const metadataKey = `${key}Metadata`
    // @ts-ignore
    if (this[contractKey] !== undefined) return this[contractKey]

    const contractAddress = await getContractAddress()
    const { contractMetadata, contract } = getMetadataAndContract(
      this.chainId,
      this.signerOrProvider,
      contractType,
      this.contractMetadataList,
      contractAddress
    )
    // @ts-ignore
    this[metadataKey] = contractMetadata
    // @ts-ignore
    this[contractKey] = contract
    return contract
  }

  /**
   * Fetches the address of the DrawCalculator and caches the ethers Contract for the DrawCalculator
   * @returns an ethers Contract for the DrawCalculator related to this PrizeDistributor
   */
  async getDrawCalculatorContract(): Promise<Contract> {
    const getAddress = async () => {
      let result: Result = await this.prizeDistributorContract.functions.getDrawCalculator()
      let address = result[0]
      const contractMetadata = this.contractMetadataList.find(
        (contractMetadata) =>
          contractMetadata.chainId === this.chainId && contractMetadata.address === address
      )
      if (contractMetadata?.type === ContractType.DrawCalculatorTimelock) {
        result = await this.drawCalculatorTimelockContract.functions.getDrawCalculator()
        address = result[0]
        return address
      } else {
        return address
      }
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

  //////////////////////////// Methods ////////////////////////////

  /**
   * Returns the users address of the provided Signer.
   * PrizeDistributor must be initialized with a Signer.
   * @param errorPrefix the class and function name of where the error occurred
   * @returns the address of the user
   */
  async getUsersAddress(errorPrefix = 'PrizeDistributors [getUsersAddress] |') {
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
