import { Contract, Event } from '@ethersproject/contracts'
import { Result } from '@ethersproject/abi'
import { ContractType } from './constants'
import {
  ChildContractAddresses,
  Contract as ContractMetadata,
  ContractList,
  Draw,
  PrizeDistribution,
  DrawResults,
  Claim,
  DrawCalcUser
} from './types'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { contract as etherplexContract, batch, Context } from '@pooltogether/etherplex'
import { BaseProvider, TransactionResponse } from '@ethersproject/providers'
import { extendContractWithChildren } from './utils/extendContractWithChildren'
import { getMetadataAndContract } from './utils/getMetadataAndContract'
import { prepareClaims, calculateDrawResults } from '@pooltogether/draw-calculator-js'
import { getContractsByType } from './utils/getContractsByType'
import { sortContractsByChainId } from './utils/sortContractsByChainId'
import { sortContractsByContractTypeAndChildren } from './utils/sortContractsByContractTypeAndChildren'
import { validateAddress, validateIsSigner, validateSignerNetwork } from './utils/validation'
import { BigNumber, ethers } from 'ethers'

/**
 * Can be instantiated with a signer or a provider.
 * If a provider is provided, only read methods are available.
 * NOTE: Ideally this is nested underneath a PrizePool.
 * Then when a Player is created, so is a new PrizeDistributors with a signer all ready to go.
 */
export class PrizeDistributor {
  readonly signerOrProvider: Provider | Signer
  readonly contractMetadataList: ContractMetadata[]
  readonly chainId: number
  readonly address: string

  // Contract metadata
  readonly prizeDistributorsMetadata: ContractMetadata
  readonly drawCalculatorMetadata: ContractMetadata
  drawBuffer: ContractMetadata | undefined
  prizeDistributionsBuffer: ContractMetadata | undefined

  // Ethers contracts
  readonly prizeDistributorsContract: Contract
  readonly drawCalculatorContract: Contract
  drawBufferContract: Contract | undefined
  prizeDistributionsBufferContract: Contract | undefined

  /**
   * NOTE: Assumes a list of only the relevant contracts was provided
   * @constructor
   * @param signerOrProvider
   * @param contractMetadataList a filtered list of relevant contract metadata.
   */
  constructor(signerOrProvider: Provider | Signer, contractMetadataList: ContractMetadata[]) {
    // Get contract metadata & ethers contracts
    const [prizeDistributorsContractMetadata, prizeDistributorsContract] = getMetadataAndContract(
      signerOrProvider,
      ContractType.PrizeDistributor,
      contractMetadataList
    )
    const [drawCalculatorContractMetadata, drawCalculatorContract] = getMetadataAndContract(
      signerOrProvider,
      ContractType.DrawCalculator,
      contractMetadataList
    )

    // Set data
    this.signerOrProvider = signerOrProvider
    this.contractMetadataList = contractMetadataList
    this.chainId = prizeDistributorsContractMetadata.chainId
    this.address = prizeDistributorsContractMetadata.address

    // Set metadata
    this.prizeDistributorsMetadata = prizeDistributorsContractMetadata
    this.drawCalculatorMetadata = drawCalculatorContractMetadata

    // Set ethers contracts
    this.prizeDistributorsContract = prizeDistributorsContract
    this.drawCalculatorContract = drawCalculatorContract

    // Initialized later - requires a fetch
    this.drawBuffer = undefined
    this.prizeDistributionsBuffer = undefined
    this.drawBufferContract = undefined
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

    const drawResults = await this.getUsersPrizes(usersAddress, draw)
    return this.claimPrizesByDrawResults(drawResults)
  }

  /**
   * Submits a transaction to claim a users prizes
   * @param drawResults
   * @returns
   */
  async claimPrizesByDrawResults(drawResults: DrawResults): Promise<TransactionResponse> {
    const errorPrefix = 'PrizeDistributors [claimPrizes] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)
    await this.validateSignerNetwork(errorPrefix)

    if (drawResults.totalValue.isZero()) {
      throw new Error(errorPrefix + 'No prizes to claim.')
    }

    const claim: Claim = prepareClaims({ address: usersAddress } as DrawCalcUser, [drawResults])
    return this.prizeDistributorsContract.claim(
      claim.userAddress,
      claim.drawIds,
      claim.encodedWinningPickIndices
    )
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
   * Gets the list of draw ids of draws that are available on the contract
   * @returns draw id array ranging from oldest to newest draw
   */
  async getValidDrawIds(): Promise<number[]> {
    const [oldestDraw, newestDraw] = await Promise.allSettled([
      this.getOldestDraw(),
      this.getNewestDraw()
    ])
    // If newest failed, there are none
    // TODO: Check oldest for id 0 as well
    if (newestDraw.status === 'rejected' || oldestDraw.status === 'rejected') {
      return []
    }

    const oldestId = oldestDraw.value.drawId
    const newestId = newestDraw.value.drawId
    const validIds = []
    for (let i = oldestId; i <= newestId; i++) {
      validIds.push(i)
    }
    return validIds
  }

  /**
   * Gets the list of draw ids of draws that have prize distributions set.
   * TODO:
   * @returns draw id array ranging from oldest to newest draw
   */
  async getClaimableDrawIds(): Promise<number[]> {
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

    const oldestId = Math.max(oldestPrizeDistributionId, oldestDrawId)
    const newestId = Math.min(newestDrawId, newestPrizeDistributionId)

    const claimableIds = []
    for (let i = oldestId; i <= newestId; i++) {
      claimableIds.push(i)
    }
    return claimableIds
  }

  async getClaimableDrawsAndPrizeDistributions(): Promise<
    { draw: Draw; prizeDistribution: PrizeDistribution }[]
  > {
    const claimableDrawIds = await this.getClaimableDrawIds()
    return this.getDrawsAndPrizeDistributions(claimableDrawIds)
  }

  async getDrawsAndPrizeDistributions(
    drawIds: number[]
  ): Promise<{ draw: Draw; prizeDistribution: PrizeDistribution }[]> {
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

    const drawsAndPrizeDistributions: { draw: Draw; prizeDistribution: PrizeDistribution }[] = []
    drawsResponse.value.map((draw, index) => {
      drawsAndPrizeDistributions.push({
        draw,
        prizeDistribution: prizeDistributionsResponse.value[index]
      })
    })

    return drawsAndPrizeDistributions
  }

  async getDraw(drawId: number): Promise<Draw> {
    const drawBufferContract = await this.getDrawBufferContract()
    const response: Result = await drawBufferContract.functions.getDraw(drawId)
    return {
      drawId: response[0].drawId,
      timestamp: response[0].timestamp,
      winningRandomNumber: response[0].winningRandomNumber
    }
  }

  async getDraws(drawIds: number[]): Promise<Draw[]> {
    if (!drawIds || drawIds.length === 0) {
      return []
    }
    const drawBufferContract = await this.getDrawBufferContract()
    const response: Result = await drawBufferContract.functions.getDraws(drawIds)
    return response[0].map((draw: Partial<Draw>) => ({
      drawId: draw.drawId,
      timestamp: draw.timestamp,
      winningRandomNumber: draw.winningRandomNumber
    }))
  }

  async getClaimableDraws(): Promise<Draw[]> {
    const claimableDrawIds = await this.getClaimableDrawIds()
    return await this.getDraws(claimableDrawIds)
  }

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

  async getPrizeDistributions(drawIds: number[]): Promise<PrizeDistribution[]> {
    if (!drawIds || drawIds.length === 0) {
      return []
    }
    const prizeDistributionsBufferContract = await this.getPrizeDistributionsBufferContract()
    const prizeDistributionsResults: Result = await prizeDistributionsBufferContract.functions.getPrizeDistributions(
      drawIds
    )
    return prizeDistributionsResults[0].map((result: Partial<PrizeDistribution>) => ({
      matchCardinality: result.matchCardinality,
      tiers: result.tiers,
      bitRangeSize: result.bitRangeSize,
      maxPicksPerUser: result.maxPicksPerUser,
      numberOfPicks: result.numberOfPicks,
      prize: result.prize,
      drawStartTimestampOffset: result.drawStartTimestampOffset,
      drawEndTimestampOffset: result.drawEndTimestampOffset
    }))
  }

  async getClaimablePrizeDistributions(): Promise<PrizeDistribution[]> {
    const claimableDrawIds = await this.getClaimableDrawIds()
    return await this.getPrizeDistributions(claimableDrawIds)
  }

  async getUsersClaimedAmount(usersAddress: string, drawId: number): Promise<BigNumber> {
    const errorPrefix = 'PrizeDistributors [getUsersClaimedAmount] |'
    await validateAddress(errorPrefix, usersAddress)

    const result: Result = await this.prizeDistributorsContract.functions.getDrawPayoutBalanceOf(
      usersAddress,
      drawId
    )
    return result[0]
  }

  async getUsersClaimedAmounts(usersAddress: string, drawIds: number[]): Promise<BigNumber[]> {
    return await Promise.all(
      drawIds.map((drawId) => this.getUsersClaimedAmount(usersAddress, drawId))
    )
  }

  async getUsersNormalizedBalancesForDrawIds(
    usersAddress: string,
    drawIds: number[]
  ): Promise<BigNumber[]> {
    const errorPrefix = 'PrizeDistributors [getUsersNormalizedBalancesForDrawIds] |'
    await validateAddress(errorPrefix, usersAddress)

    const result: Result = await this.drawCalculatorContract.functions.getNormalizedBalancesForDrawIds(
      usersAddress,
      drawIds
    )
    return result[0]
  }

  /**
   *
   * @param usersAddress
   * @param draw
   * @returns
   */
  async getUsersPrizes(usersAddress: string, draw: Draw): Promise<DrawResults> {
    // Fetch the draw settings for the draw
    const prizeDistributions: PrizeDistribution = await this.getPrizeDistribution(draw.drawId)

    // Fetch users normalized balance
    const balanceResult = await this.drawCalculatorContract.functions.getNormalizedBalancesForDrawIds(
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
      const results = calculateDrawResults(prizeDistributions, draw, user)
      return results
    }
  }

  async getUsersPrizesByDrawId(usersAddress: string, drawId: number): Promise<DrawResults> {
    const draw = await this.getDraw(drawId)
    return this.getUsersPrizes(usersAddress, draw)
  }

  async getUsersClaimedEvents(usersAddress: string) {
    const errorPrefix = 'PrizeDistributors [getUsersClaimedEvents] |'
    await validateAddress(errorPrefix, usersAddress)

    const eventFilter = this.prizeDistributorsContract.filters.ClaimedDraw(usersAddress)
    return await this.prizeDistributorsContract.queryFilter(eventFilter)
  }

  // TODO: Check this
  async getUsersClaimedEvent(usersAddress: string, draw: Draw): Promise<Event> {
    const eventFilter = this.prizeDistributorsContract.filters.ClaimedDraw(
      usersAddress,
      draw.drawId
    )
    const events = await this.prizeDistributorsContract.queryFilter(eventFilter)
    return events[0]
  }

  //////////////////////////// Ethers Contracts ////////////////////////////

  private async getAndSetEthersContract(
    contractMetadataKey: string,
    contractType: ContractType,
    getContractAddress: () => Promise<string>
  ): Promise<Contract> {
    const contractKey = `${contractMetadataKey}Contract`
    // @ts-ignore
    if (this[contractKey] !== undefined) return this[contractKey]

    const contractAddress = await getContractAddress()
    const [contractMetadata, contract] = getMetadataAndContract(
      this.signerOrProvider,
      contractType,
      this.contractMetadataList,
      contractAddress
    )
    // @ts-ignore
    this[contractMetadataKey] = contractMetadata
    // @ts-ignore
    this[contractKey] = contract
    return contract
  }

  async getDrawBufferContract(): Promise<Contract> {
    const getDrawBufferAddress = async () => {
      const result: Result = await this.drawCalculatorContract.functions.getDrawBuffer()
      return result[0]
    }
    return this.getAndSetEthersContract('drawBuffer', ContractType.DrawBuffer, getDrawBufferAddress)
  }

  async getPrizeDistributionsBufferContract(): Promise<Contract> {
    const getPrizeDistributionsBufferAddress = async () => {
      const result: Result = await this.drawCalculatorContract.functions.getPrizeDistributionBuffer()
      return result[0]
    }
    return this.getAndSetEthersContract(
      'prizeDistributionsBuffer',
      ContractType.PrizeDistributionBuffer,
      getPrizeDistributionsBufferAddress
    )
  }

  //////////////////////////// Methods ////////////////////////////

  id(): string {
    return `${this.prizeDistributorsMetadata.address}-${this.prizeDistributorsMetadata.chainId}`
  }

  async getUsersAddress(errorPrefix = 'PrizeDistributors [getUsersAddress] |') {
    const signer = await this.validateIsSigner(errorPrefix)
    return await signer.getAddress()
  }

  async validateSignerNetwork(errorPrefix: string) {
    return validateSignerNetwork(errorPrefix, this.signerOrProvider as Signer, this.chainId)
  }

  async validateIsSigner(errorPrefix: string) {
    return validateIsSigner(errorPrefix, this.signerOrProvider)
  }
}

/**
 * Fetches contract addresses on chain so we can link them to the Claimable Draw
 * May be replaced in the future by adding extensions into the contract list.
 * @constructor
 * @param signersOrProviders
 * @param linkedPrizePoolContractList
 * @returns
 */
export async function initializePrizeDistributors(
  signersOrProviders: { [chainId: number]: Provider | Signer },
  linkedPrizePoolContractList: ContractList
): Promise<PrizeDistributor[] | null> {
  const contracts = linkedPrizePoolContractList.contracts
  const prizeDistributorsContracts = getContractsByType(contracts, ContractType.PrizeDistributor)
  const prizeDistributorsContractsByChainId = sortContractsByChainId(prizeDistributorsContracts)
  const chainIds = Object.keys(prizeDistributorsContractsByChainId).map(Number)

  // Fetch addresses for relationships between claimable draws and child contracts
  const prizeDistributorsAddressBatchRequestPromises = chainIds.map((chainId) =>
    fetchClaimableDrawAddressesByChainId(
      chainId,
      signersOrProviders[chainId],
      prizeDistributorsContractsByChainId[chainId]
    )
  )
  const prizeDistributorsAddressesResponses = await Promise.allSettled(
    prizeDistributorsAddressBatchRequestPromises
  )
  const prizeDistributorsAddresses: {
    chainId: number
    addressesByClaimableDraw: { [address: string]: { [key: string]: string } }
  }[] = []
  prizeDistributorsAddressesResponses.forEach((response) => {
    if (response.status === 'fulfilled') {
      prizeDistributorsAddresses.push(response.value)
    } else {
      console.error(
        'Fetching contract addresses for prize distributors failed with error: ',
        response.reason
      )
      throw new Error(response.reason)
    }
  })

  // Sort children addresses by chain id
  const prizeDistributorsAddressesByChainId: ChildContractAddresses = {}
  prizeDistributorsAddresses.forEach(
    (addressessResponse) =>
      (prizeDistributorsAddressesByChainId[addressessResponse.chainId] =
        addressessResponse.addressesByClaimableDraw)
  )

  // Extend contracts with children
  const contractsWithChildren = extendContractWithChildren(
    contracts,
    prizeDistributorsAddressesByChainId,
    ContractType.PrizeDistributor
  )

  // Sort contract lists
  const sortedContractLists = sortContractsByContractTypeAndChildren(
    contractsWithChildren,
    ContractType.PrizeDistributor
  )

  // Need to inject some more contracts since they get linked later
  // TODO: Need to properly match these contracts
  // - DrawBuffer
  // - PrizeDistributionsBuffer
  // - Ticket
  // - DrawCalculatorTimelock
  const finalContractLists: ContractMetadata[][] = []
  sortedContractLists.forEach((contractList) => {
    const chainId = contractList[0].chainId

    // DrawBuffer
    const drawBufferMetadatas = getContractsByType(contracts, ContractType.DrawBuffer)
    const drawBufferMetadata = drawBufferMetadatas.find((contract) => contract.chainId === chainId)

    // PrizeDistributionsBuffer
    const prizeDistributionsBufferMetadatas = getContractsByType(
      contracts,
      ContractType.PrizeDistributionBuffer
    )
    const prizeDistributionsMetadata = prizeDistributionsBufferMetadatas.find(
      (contract) => contract.chainId === chainId
    )

    // Ticket
    const ticketMetadatas = getContractsByType(contracts, ContractType.Ticket)
    const ticketMetadata = ticketMetadatas.find((contract) => contract.chainId === chainId)

    // Push contracts
    const newContractList: ContractMetadata[] = [...contractList]
    if (drawBufferMetadata) newContractList.push(drawBufferMetadata)
    if (ticketMetadata) newContractList.push(ticketMetadata)
    if (prizeDistributionsMetadata) newContractList.push(prizeDistributionsMetadata)
    finalContractLists.push(newContractList)
  })

  return finalContractLists.map((contractList) => {
    const chainId = contractList[0].chainId
    return new PrizeDistributor(signersOrProviders[chainId], contractList)
  })
}

/**
 * Fetches relevant addresses from the PrizeDistributors to match with the provided contract list.
 * - DrawCalculator
 * @param chainId
 * @param signerOrProvider
 * @param prizeDistributorsContracts
 * @returns
 */
async function fetchClaimableDrawAddressesByChainId(
  chainId: number,
  signerOrProvider: Signer | Provider,
  prizeDistributorsContracts: ContractMetadata[]
) {
  const batchCalls = [] as Context[]
  prizeDistributorsContracts.forEach((prizeDistributorsContract) => {
    const prizeDistributorsEtherplexContract = etherplexContract(
      prizeDistributorsContract.address,
      prizeDistributorsContract.abi,
      prizeDistributorsContract.address
    )
    // @ts-ignore: Property doesn't exist on MulticallContract
    batchCalls.push(prizeDistributorsEtherplexContract.getDrawCalculator())
  })
  const result = await batch(signerOrProvider as BaseProvider, ...batchCalls)
  const addressesByClaimableDraw = {} as { [address: string]: { [key: string]: string } }
  Object.keys(result).forEach(
    (prizeDistributorsAddress: any) =>
      (addressesByClaimableDraw[prizeDistributorsAddress] = {
        drawCalculator: result[prizeDistributorsAddress].getDrawCalculator[0]
      })
  )
  return { chainId, addressesByClaimableDraw }
}
