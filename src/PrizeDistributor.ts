import { Contract, Event, Overrides } from '@ethersproject/contracts'
import { Result } from '@ethersproject/abi'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { TransactionResponse } from '@ethersproject/providers'
import {
  prepareClaims,
  calculateDrawResults,
  filterResultsByValue
} from '@pooltogether/draw-calculator-js'
import { BigNumber, ethers } from 'ethers'

import { ContractType } from './constants'
import {
  Contract as ContractMetadata,
  ContractList,
  Draw,
  PrizeDistribution,
  DrawResults,
  Claim,
  DrawCalcUser,
  SignersOrProviders
} from './types'
import {
  getMetadataAndContract,
  validateAddress,
  validateIsSigner,
  validateSignerNetwork
} from './utils'

/**
 * Can be instantiated with a signer or a provider.
 * If a provider is provided, only read methods are available.
 * NOTE: Ideally this is nested underneath a PrizePool.
 * TODO: Make metadata readonly by using getters and private setters.
 * Then when a User is created, so is a new PrizeDistributors with a signer all ready to go.
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

  // Ethers contracts
  readonly prizeDistributorContract: Contract
  readonly drawCalculatorTimelockContract: Contract
  drawCalculatorContract: Contract | undefined
  drawBufferContract: Contract | undefined
  prizeDistributionsBufferContract: Contract | undefined

  /**
   * NOTE: Assumes that there is only one DrawCalculaotrTimelock on the network for the provided prizeDistributorMetadata.
   * @constructor
   * @param signerOrProvider
   * @param contractMetadataList a filtered list of relevant contract metadata.
   */
  constructor(
    prizeDistributorMetadata: ContractMetadata,
    signerOrProvider: Provider | Signer,
    contractMetadataList: ContractMetadata[]
  ) {
    // Get contract metadata & ethers contracts
    const [drawCalculatorTimelockMetadata, drawCalculatorTimelockContract] = getMetadataAndContract(
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

  //////////////////////////// Ethers write functions ////////////////////////////

  /**
   * Fetches a users prizes for a draw and submits a transaction to claim them.
   * @param draw
   * @returns
   */
  async claimPrizesByDraw(draw: Draw): Promise<TransactionResponse> {
    const errorPrefix = 'PrizeDistributors [claim] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)

    const drawResults = await this.calculateUsersPrizes(usersAddress, draw)
    return this.claimPrizesByDrawResults(drawResults)
  }

  /**
   * Submits a transaction to claim a users prizes
   * @param drawResults
   * @returns
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
   * Submits a transaction to claim a users prizes
   * @param drawResults an array of draw results to claim
   * @returns
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

  /**
   * Fetches claimed events for the provided user
   * @returns Event
   */
  async getClaimedEvents() {
    const errorPrefix = 'PrizeDistributors [getClaimedEvents] |'
    const usersAddress = await this.getUsersAddress(errorPrefix)

    return this.getUsersClaimedEvents(usersAddress)
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  // TODO: Get past distribution
  // TODO: Get past prizes
  // TODO: Our Tsunami frontend will do this outside of here since it's hardcoded.

  // NOTE: getNewestDraw will error if there is no draw pushed
  async getNewestDraw(): Promise<Draw> {
    const drawBufferContract = await this.getDrawBufferContract()
    const result: Result = await drawBufferContract.functions.getNewestDraw()
    const draw = result[0]
    return {
      drawId: draw.drawId,
      timestamp: draw.timestamp,
      winningRandomNumber: draw.winningRandomNumber
    }
  }

  async getOldestDraw(): Promise<Draw> {
    const drawBufferContract = await this.getDrawBufferContract()
    const result: Result = await drawBufferContract.functions.getOldestDraw()
    const draw = result[0]
    return {
      drawId: draw.drawId,
      timestamp: draw.timestamp,
      winningRandomNumber: draw.winningRandomNumber
    }
  }

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
   *
   * @returns
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
   *
   * @returns all draw ids in the buffer
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
   *
   * @returns all draw ids in the buffer
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
   * Gets the list of draw ids of draws that have prize distributions set.
   * @returns draw id array ranging from oldest to newest draw
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
   *
   * @param drawIds
   * @returns
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
   *
   * @param drawId
   * @returns
   */
  async getDraw(drawId: number): Promise<Draw> {
    const drawBufferContract = await this.getDrawBufferContract()
    const response: Result = await drawBufferContract.functions.getDraw(drawId)
    return {
      drawId: response[0].drawId,
      timestamp: response[0].timestamp,
      winningRandomNumber: response[0].winningRandomNumber
    }
  }

  /**
   *
   * @param drawIds
   * @returns
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
        winningRandomNumber: draw.winningRandomNumber
      }
    })
    return draws
  }

  /**
   *
   * @param drawId
   * @returns
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
   *
   * @param drawIds
   * @returns
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
   *
   * @param usersAddress
   * @param drawId
   * @returns
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
   *
   * @param usersAddress
   * @param drawIds
   * @returns
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
   *
   * @param usersAddress
   * @param drawIds
   * @returns
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
   * NOTE: This is computationally expensive and may cause a long delay.
   * @param usersAddress
   * @param draw
   * @returns
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
      const drawResults = calculateDrawResults(prizeDistribution, draw, user)
      return filterResultsByValue(drawResults, prizeDistribution.maxPicksPerUser)
    }
  }

  /**
   * Calculates the prizes a user won for a specific draw id.
   * NOTE: This is computationally expensive and may cause a long delay.
   * @param usersAddress
   * @param drawId
   * @returns
   */
  async calculateUsersPrizesByDrawId(usersAddress: string, drawId: number): Promise<DrawResults> {
    const draw = await this.getDraw(drawId)
    return this.calculateUsersPrizes(usersAddress, draw)
  }

  /**
   *
   * @param usersAddress
   * @returns
   */
  async getUsersClaimedEvents(usersAddress: string) {
    const errorPrefix = 'PrizeDistributors [getUsersClaimedEvents] |'
    await validateAddress(errorPrefix, usersAddress)

    const eventFilter = this.prizeDistributorContract.filters.ClaimedDraw(usersAddress)
    return await this.prizeDistributorContract.queryFilter(eventFilter)
  }

  /**
   * TODO: Check this
   * @param usersAddress
   * @param draw
   * @returns
   */
  async getUsersClaimedEvent(usersAddress: string, draw: Draw): Promise<Event> {
    const eventFilter = this.prizeDistributorContract.filters.ClaimedDraw(usersAddress, draw.drawId)
    const events = await this.prizeDistributorContract.queryFilter(eventFilter)
    return events[0]
  }

  //////////////////////////// Ethers Contracts Initializers ////////////////////////////

  /**
   *
   * @param contractMetadataKey
   * @param contractType
   * @param getContractAddress
   * @returns
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
    const [contractMetadata, contract] = getMetadataAndContract(
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
   *
   * @returns
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
   *
   * @returns
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
   *
   * @returns
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

  //////////////////////////// Methods ////////////////////////////

  /**
   *
   * @returns
   */
  id(): string {
    return `${this.prizeDistributorMetadata.address}-${this.prizeDistributorMetadata.chainId}`
  }

  /**
   *
   * @param errorPrefix
   * @returns
   */
  async getUsersAddress(errorPrefix = 'PrizeDistributors [getUsersAddress] |') {
    const signer = await this.validateIsSigner(errorPrefix)
    return await signer.getAddress()
  }

  /**
   *
   * @param errorPrefix
   * @returns
   */
  async validateSignerNetwork(errorPrefix: string) {
    return validateSignerNetwork(errorPrefix, this.signerOrProvider as Signer, this.chainId)
  }

  /**
   *
   * @param errorPrefix
   * @returns
   */
  async validateIsSigner(errorPrefix: string) {
    return validateIsSigner(errorPrefix, this.signerOrProvider)
  }
}

/**
 * Utility function to create several PrizeDistributors from a contract list.
 * @param contractList
 * @param signersOrProviders
 * @returns
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
