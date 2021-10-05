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
 * Then when a Player is created, so is a new DrawPrizes with a signer all ready to go.
 */
export class DrawPrize {
  readonly signerOrProvider: Provider | Signer
  readonly contractMetadataList: ContractMetadata[]
  readonly chainId: number
  readonly address: string

  // Contract metadata
  readonly drawPrizesMetadata: ContractMetadata
  readonly drawCalculatorMetadata: ContractMetadata
  drawHistory: ContractMetadata | undefined
  prizeDistributionsHistory: ContractMetadata | undefined

  // Ethers contracts
  readonly drawPrizesContract: Contract
  readonly drawCalculatorContract: Contract
  drawHistoryContract: Contract | undefined
  prizeDistributionsHistoryContract: Contract | undefined

  /**
   * NOTE: Assumes a list of only the relevant contracts was provided
   * @constructor
   * @param signerOrProvider
   * @param contractMetadataList a filtered list of relevant contract metadata.
   */
  constructor(signerOrProvider: Provider | Signer, contractMetadataList: ContractMetadata[]) {
    // Get contract metadata & ethers contracts
    const [drawPrizesContractMetadata, drawPrizesContract] = getMetadataAndContract(
      signerOrProvider,
      ContractType.DrawPrize,
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
    this.chainId = drawPrizesContractMetadata.chainId
    this.address = drawPrizesContractMetadata.address

    // Set metadata
    this.drawPrizesMetadata = drawPrizesContractMetadata
    this.drawCalculatorMetadata = drawCalculatorContractMetadata

    // Set ethers contracts
    this.drawPrizesContract = drawPrizesContract
    this.drawCalculatorContract = drawCalculatorContract

    // Initialized later - requires a fetch
    this.drawHistory = undefined
    this.prizeDistributionsHistory = undefined
    this.drawHistoryContract = undefined
    this.prizeDistributionsHistoryContract = undefined
  }

  //////////////////////////// Ethers write functions ////////////////////////////

  /**
   * Fetches a users prizes for a draw and submits a transaction to claim them.
   * @param draw
   * @returns
   */
  async claimPrizesByDraw(draw: Draw): Promise<TransactionResponse> {
    const errorPrefix = 'DrawPrizes [claim] | '
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
    const errorPrefix = 'DrawPrizes [claimPrizes] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)
    await this.validateSignerNetwork(errorPrefix)

    if (drawResults.totalValue.isZero()) {
      throw new Error(errorPrefix + 'No prizes to claim.')
    }

    const claim: Claim = prepareClaims({ address: usersAddress } as DrawCalcUser, [drawResults])
    return this.drawPrizesContract.claim(
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
    const errorPrefix = 'DrawPrizes [getClaimedEvents] |'
    const usersAddress = await this.getUsersAddress(errorPrefix)

    return this.getUsersClaimedEvents(usersAddress)
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  // TODO: Get past distribution
  // TODO: Get past prizes
  // TODO: Our Tsunami frontend will do this outside of here since it's hardcoded.

  // NOTE: getNewestDraw will error if there is no draw pushed
  async getNewestDraw(): Promise<Draw> {
    const drawHistoryContract = await this.getDrawHistoryContract()
    const result: Result = await drawHistoryContract.functions.getNewestDraw()
    const draw = result[0]
    return {
      drawId: draw.drawId,
      timestamp: draw.timestamp,
      winningRandomNumber: draw.winningRandomNumber
    }
  }

  async getOldestDraw(): Promise<Draw> {
    const drawHistoryContract = await this.getDrawHistoryContract()
    const result: Result = await drawHistoryContract.functions.getOldestDraw()
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
    const prizeDistributionHistoryContract = await this.getPrizeDistributionsHistoryContract()
    const result: Result = await prizeDistributionHistoryContract.functions.getNewestPrizeDistribution()
    const prizeDistribution = result[0]
    const drawId: number = result[1]
    return {
      prizeDistribution: {
        matchCardinality: prizeDistribution.matchCardinality,
        numberOfPicks: prizeDistribution.numberOfPicks,
        distributions: prizeDistribution.distributions,
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
    const prizeDistributionHistoryContract = await this.getPrizeDistributionsHistoryContract()
    const result: Result = await prizeDistributionHistoryContract.functions.getOldestPrizeDistribution()
    const prizeDistribution = result[0]
    const drawId: number = result[1]
    return {
      prizeDistribution: {
        matchCardinality: prizeDistribution.matchCardinality,
        numberOfPicks: prizeDistribution.numberOfPicks,
        distributions: prizeDistribution.distributions,
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
    const [oldestDraw, newestDraw] = await Promise.allSettled([
      this.getOldestPrizeDistribution(),
      this.getNewestPrizeDistribution()
    ])
    // If newest failed, there are none
    // TODO: Check oldest for id 0 as well
    // TODO: Do the same empty states apply for the prize distribution buffer?
    if (newestDraw.status === 'rejected' || oldestDraw.status === 'rejected') {
      return []
    }

    const oldestId = oldestDraw.value.drawId
    const newestId = newestDraw.value.drawId
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
    const drawHistoryContract = await this.getDrawHistoryContract()
    const response: Result = await drawHistoryContract.functions.getDraw(drawId)
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
    const drawHistoryContract = await this.getDrawHistoryContract()
    const response: Result = await drawHistoryContract.functions.getDraws(drawIds)
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
    const prizeDistributionsHistoryContract = await this.getPrizeDistributionsHistoryContract()
    const result: Result = await prizeDistributionsHistoryContract.functions.getPrizeDistribution(
      drawId
    )
    return {
      matchCardinality: result[0].matchCardinality,
      distributions: result[0].distributions,
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
    const prizeDistributionsHistoryContract = await this.getPrizeDistributionsHistoryContract()
    const prizeDistributionsResults: Result = await prizeDistributionsHistoryContract.functions.getPrizeDistributions(
      drawIds
    )
    return prizeDistributionsResults[0].map((result: Partial<PrizeDistribution>) => ({
      matchCardinality: result.matchCardinality,
      distributions: result.distributions,
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
    const errorPrefix = 'DrawPrizes [getUsersClaimedAmount] |'
    await validateAddress(errorPrefix, usersAddress)

    const result: Result = await this.drawPrizesContract.functions.getDrawPayoutBalanceOf(
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
    const errorPrefix = 'DrawPrizes [getUsersClaimedEvents] |'
    await validateAddress(errorPrefix, usersAddress)

    const eventFilter = this.drawPrizesContract.filters.ClaimedDraw(usersAddress)
    return await this.drawPrizesContract.queryFilter(eventFilter)
  }

  // TODO: Check this
  async getUsersClaimedEvent(usersAddress: string, draw: Draw): Promise<Event> {
    const eventFilter = this.drawPrizesContract.filters.ClaimedDraw(usersAddress, draw.drawId)
    const events = await this.drawPrizesContract.queryFilter(eventFilter)
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

  async getDrawHistoryContract(): Promise<Contract> {
    const getDrawHistoryAddress = async () => {
      const result: Result = await this.drawCalculatorContract.functions.getDrawHistory()
      return result[0]
    }
    return this.getAndSetEthersContract(
      'drawHistory',
      ContractType.DrawHistory,
      getDrawHistoryAddress
    )
  }

  async getPrizeDistributionsHistoryContract(): Promise<Contract> {
    const getPrizeDistributionsHistoryAddress = async () => {
      const result: Result = await this.drawCalculatorContract.functions.getPrizeDistributionHistory()
      return result[0]
    }
    return this.getAndSetEthersContract(
      'prizeDistributionsHistory',
      ContractType.PrizeDistributionHistory,
      getPrizeDistributionsHistoryAddress
    )
  }

  //////////////////////////// Methods ////////////////////////////

  id(): string {
    return `${this.drawPrizesMetadata.address}-${this.drawPrizesMetadata.chainId}`
  }

  async getUsersAddress(errorPrefix = 'DrawPrizes [getUsersAddress] |') {
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
export async function initializeDrawPrizes(
  signersOrProviders: { [chainId: number]: Provider | Signer },
  linkedPrizePoolContractList: ContractList
): Promise<DrawPrize[] | null> {
  const contracts = linkedPrizePoolContractList.contracts
  const drawPrizesContracts = getContractsByType(contracts, ContractType.DrawPrize)
  const drawPrizesContractsByChainId = sortContractsByChainId(drawPrizesContracts)
  const chainIds = Object.keys(drawPrizesContractsByChainId).map(Number)

  // Fetch addresses for relationships between claimable draws and child contracts
  const drawPrizesAddressBatchRequestPromises = chainIds.map((chainId) =>
    fetchClaimableDrawAddressesByChainId(
      chainId,
      signersOrProviders[chainId],
      drawPrizesContractsByChainId[chainId]
    )
  )
  const drawPrizesAddressesResponses = await Promise.allSettled(
    drawPrizesAddressBatchRequestPromises
  )
  const drawPrizesAddresses: {
    chainId: number
    addressesByClaimableDraw: { [address: string]: { [key: string]: string } }
  }[] = []
  drawPrizesAddressesResponses.forEach((response) => {
    if (response.status === 'fulfilled') {
      drawPrizesAddresses.push(response.value)
    } else {
      console.error(
        'Fetching contract addresses for draw prizes failed with error: ',
        response.reason
      )
      throw new Error(response.reason)
    }
  })

  // Sort children addresses by chain id
  const drawPrizesAddressesByChainId: ChildContractAddresses = {}
  drawPrizesAddresses.forEach(
    (addressessResponse) =>
      (drawPrizesAddressesByChainId[addressessResponse.chainId] =
        addressessResponse.addressesByClaimableDraw)
  )

  // Extend contracts with children
  const contractsWithChildren = extendContractWithChildren(
    contracts,
    drawPrizesAddressesByChainId,
    ContractType.DrawPrize
  )

  // Sort contract lists
  const sortedContractLists = sortContractsByContractTypeAndChildren(
    contractsWithChildren,
    ContractType.DrawPrize
  )

  // Need to inject some more contracts since they get linked later
  // TODO: Need to properly match these contracts
  // - DrawHistory
  // - PrizeDistributionsHistory
  // - Ticket
  const finalContractLists: ContractMetadata[][] = []
  sortedContractLists.forEach((contractList) => {
    const chainId = contractList[0].chainId

    // DrawHistory
    const drawHistoryMetadatas = getContractsByType(contracts, ContractType.DrawHistory)
    const drawHistoryMetadata = drawHistoryMetadatas.find(
      (contract) => contract.chainId === chainId
    )

    // PrizeDistributionsHistory
    const prizeDistributionsHistoryMetadatas = getContractsByType(
      contracts,
      ContractType.PrizeDistributionHistory
    )
    const prizeDistributionsMetadata = prizeDistributionsHistoryMetadatas.find(
      (contract) => contract.chainId === chainId
    )

    // Ticket
    const ticketMetadatas = getContractsByType(contracts, ContractType.Ticket)
    const ticketMetadata = ticketMetadatas.find((contract) => contract.chainId === chainId)

    // Push contracts
    const newContractList: ContractMetadata[] = [...contractList]
    if (drawHistoryMetadata) newContractList.push(drawHistoryMetadata)
    if (ticketMetadata) newContractList.push(ticketMetadata)
    if (prizeDistributionsMetadata) newContractList.push(prizeDistributionsMetadata)
    finalContractLists.push(newContractList)
  })

  return finalContractLists.map((contractList) => {
    const chainId = contractList[0].chainId
    return new DrawPrize(signersOrProviders[chainId], contractList)
  })
}

/**
 * Fetches relevant addresses from the DrawPrizes to match with the provided contract list.
 * - DrawCalculator
 * @param chainId
 * @param signerOrProvider
 * @param drawPrizesContracts
 * @returns
 */
async function fetchClaimableDrawAddressesByChainId(
  chainId: number,
  signerOrProvider: Signer | Provider,
  drawPrizesContracts: ContractMetadata[]
) {
  const batchCalls = [] as Context[]
  drawPrizesContracts.forEach((drawPrizesContract) => {
    const drawPrizesEtherplexContract = etherplexContract(
      drawPrizesContract.address,
      drawPrizesContract.abi,
      drawPrizesContract.address
    )
    // @ts-ignore: Property doesn't exist on MulticallContract
    batchCalls.push(drawPrizesEtherplexContract.getDrawCalculator())
  })
  const result = await batch(signerOrProvider as BaseProvider, ...batchCalls)
  const addressesByClaimableDraw = {} as { [address: string]: { [key: string]: string } }
  Object.keys(result).forEach(
    (drawPrizesAddress: any) =>
      (addressesByClaimableDraw[drawPrizesAddress] = {
        drawCalculator: result[drawPrizesAddress].getDrawCalculator[0]
      })
  )
  return { chainId, addressesByClaimableDraw }
}
