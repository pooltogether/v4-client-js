import { Contract, Event } from '@ethersproject/contracts'
import { Result } from '@ethersproject/abi'
import { ContractType } from './constants'
import { ChildContractAddresses, Contract as ContractMetadata, ContractList } from './types'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { contract as etherplexContract, batch, Context } from '@pooltogether/etherplex'
import { BaseProvider, TransactionResponse } from '@ethersproject/providers'
import { extendContractWithChildren } from './utils/extendContractWithChildren'
import { getMetadataAndContract } from './utils/getMetadataAndContract'
import { BigNumber } from '@ethersproject/bignumber'
import {
  generatePicks,
  computeDrawResults,
  prepareClaimForUserFromDrawResult,
  Draw,
  DrawResults,
  Claim,
  User,
  DrawSettings
} from '@pooltogether/draw-calculator-js-sdk'
import { getContractsByType } from './utils/getContractsByType'
import { sortContractsByChainId } from './utils/sortContractsByChainId'
import { sortContractsByContractTypeAndChildren } from './utils/sortContractsByContractTypeAndChildren'
import { validateIsSigner, validateSignerNetwork } from './utils/validation'
import { ethers } from 'ethers'

/**
 * Can be instantiated with a signer or a provider.
 * If a provider is provided, only read methods are available.
 * NOTE: Ideally this is nested underneath a PrizePool.
 * Then when a Player is created, so is a new ClaimableDraw with a signer all ready to go.
 */
export class ClaimableDraw {
  readonly signerOrProvider: Provider | Signer
  readonly contractMetadataList: ContractMetadata[]
  readonly chainId: number
  readonly address: string

  // Contract metadata
  readonly claimableDraw: ContractMetadata
  readonly drawCalculator: ContractMetadata
  drawHistory: ContractMetadata | undefined
  drawSettingsHistory: ContractMetadata | undefined

  // Ethers contracts
  readonly claimableDrawContract: Contract
  readonly drawCalculatorContract: Contract
  drawHistoryContract: Contract | undefined
  drawSettingsHistoryContract: Contract | undefined

  /**
   * NOTE: Assumes a list of only the relevant contracts was provided
   * @constructor
   * @param signerOrProvider
   * @param contractMetadataList a filtered list of relevant contract metadata.
   */
  constructor(signerOrProvider: Provider | Signer, contractMetadataList: ContractMetadata[]) {
    // Get contract metadata & ethers contracts
    const [claimableDrawContractMetadata, claimableDrawContract] = getMetadataAndContract(
      signerOrProvider,
      ContractType.ClaimableDraw,
      contractMetadataList
    )
    const [drawCalculatorContractMetadata, drawCalculatorContract] = getMetadataAndContract(
      signerOrProvider,
      ContractType.TsunamiDrawCalculator,
      contractMetadataList
    )

    // Set data
    this.signerOrProvider = signerOrProvider
    this.contractMetadataList = contractMetadataList
    this.chainId = claimableDrawContractMetadata.chainId
    this.address = claimableDrawContractMetadata.address

    // Set metadata
    this.claimableDraw = claimableDrawContractMetadata
    this.drawCalculator = drawCalculatorContractMetadata

    // Set ethers contracts
    this.claimableDrawContract = claimableDrawContract
    this.drawCalculatorContract = drawCalculatorContract

    // Initialized later - requires a fetch
    this.drawHistory = undefined
    this.drawSettingsHistory = undefined
    this.drawHistoryContract = undefined
    this.drawSettingsHistoryContract = undefined
  }

  //////////////////////////// Ethers write functions ////////////////////////////

  /**
   * Fetches a users prizes for a draw and submits a transaction to claim them.
   * @param draw
   * @returns
   */
  async claimPrizesByDraw(draw: Draw): Promise<TransactionResponse> {
    const errorPrefix = 'ClaimableDraw [claim] | '
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
    const errorPrefix = 'ClaimableDraw [claimPrizes] | '
    const usersAddress = await this.getUsersAddress(errorPrefix)
    await this.validateSignerNetwork(errorPrefix)

    if (drawResults.totalValue.isZero()) {
      throw new Error(errorPrefix + 'No prizes to claim.')
    }

    const claim: Claim = prepareClaimForUserFromDrawResult(
      { address: usersAddress } as User,
      drawResults
    )
    return this.claimableDrawContract.claim(claim.userAddress, claim.drawIds, claim.data)
  }

  /**
   * Fetches claimed events for the provided user
   * @returns Event
   */
  async getClaimedEvents() {
    const errorPrefix = 'ClaimableDraw [getClaimedEvents] |'
    const usersAddress = await this.getUsersAddress(errorPrefix)

    return this.getUsersClaimedEvents(usersAddress)
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  // TODO: Get past distribution
  // TODO: Get past prizes
  // TODO: Our Tsunami frontend will do this outside of here since it's hardcoded.

  // NOTE: getNewestDraw will error if there is no draw pushed
  // Use to check if draw is ready?
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
    console.log('getOldestDraw - claimabledraw', result)
    const draw = result[0]
    return {
      drawId: draw.drawId,
      timestamp: draw.timestamp,
      winningRandomNumber: draw.winningRandomNumber
    }
  }

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

  async getValidDraws(): Promise<Draw[]> {
    const validDrawIds = await this.getValidDrawIds()
    return await this.getDraws(validDrawIds)
  }

  // TODO: Double check
  async getDraws(drawIds: number[]): Promise<Draw[]> {
    if (!drawIds || drawIds.length === 0) {
      return []
    }
    const drawHistoryContract = await this.getDrawHistoryContract()
    const response: Result = await drawHistoryContract.functions.getDraws(drawIds)
    console.log('getDraws - ClaimableDraw', response)
    return response[0].map((draw: Partial<Draw>) => ({
      drawId: draw.drawId,
      timestamp: draw.timestamp,
      winningRandomNumber: draw.winningRandomNumber
    }))
  }

  // // TODO: Double check
  // async getNextDrawId(): Promise<number> {
  //   const response: Result = await this.drawHistoryContract.functions.nextDrawIndex()
  //   console.log('getNextDrawId', response)
  //   return response[0] as number
  // }

  /**
   *
   * @param usersAddress
   * @param draw
   * @returns
   */
  async getUsersPrizes(usersAddress: string, draw: Draw): Promise<DrawResults> {
    console.log('getUsersPrizes', 'params', usersAddress, draw)

    // Fetch the draw settings for the draw
    const drawSettingsHistoryContract = await this.getDrawSettingsHistoryContract()
    const drawSettingsResult: Result = await drawSettingsHistoryContract.functions.getDrawSetting(
      draw.drawId
    )
    const drawSettings: DrawSettings = drawSettingsResult[0]
    console.log('getUsersPrizes', 'drawSettings', drawSettings)

    // Fetch the ticket for the draw calculator
    // TODO: Need to identify what ticket ABI matches
    // TODO: Should be fetching the ticket address but the fn isn't in the ABI?
    const ticketData = getContractsByType(this.contractMetadataList, ContractType.Ticket)[0]
    // const [ticketAddress] = await drawCalculatorContract.functions.ticket()
    const [, ticketContract] = getMetadataAndContract(
      this.signerOrProvider,
      ContractType.Ticket,
      this.contractMetadataList,
      ticketData.address
    )

    // Fetch users balance
    const balanceResult: Result = await ticketContract.functions.getBalanceAt(
      usersAddress,
      draw.timestamp
    )
    const balance: BigNumber = balanceResult[0]
    console.log('getUsersPrizes', 'balance', balance)

    if (balance.isZero()) {
      return {
        drawId: draw.drawId,
        totalValue: ethers.constants.Zero,
        prizes: []
      }
    } else {
      const picks = generatePicks(usersAddress, drawSettings.numberOfPicks.toNumber())
      console.log('getUsersPrizes', 'picks', picks)
      // finally call function
      const drawResults = computeDrawResults(drawSettings, draw, picks)
      console.log('getUsersPrizes', 'drawResults', drawResults)
      return drawResults
    }
  }

  async getUsersClaimedEvents(usersAddress: string) {
    const eventFilter = this.claimableDrawContract.filters.ClaimedDraw(usersAddress)
    return await this.claimableDrawContract.queryFilter(eventFilter)
  }

  // TODO: Check this
  async getUsersClaimedEvent(usersAddress: string, draw: Draw): Promise<Event> {
    const eventFilter = this.claimableDrawContract.filters.ClaimedDraw(usersAddress, draw.drawId)
    const events = await this.claimableDrawContract.queryFilter(eventFilter)
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

  async getDrawSettingsHistoryContract(): Promise<Contract> {
    const getDrawSettingsHistoryAddress = async () => {
      const result: Result = await this.drawCalculatorContract.functions.getTsunamiDrawSettingsHistory()
      return result[0]
    }
    return this.getAndSetEthersContract(
      'drawSettingsHistory',
      ContractType.TsunamiDrawSettingsHistory,
      getDrawSettingsHistoryAddress
    )
  }

  //////////////////////////// Methods ////////////////////////////

  id(): string {
    return `${this.claimableDraw.address}-${this.claimableDraw.chainId}`
  }

  async getUsersAddress(errorPrefix = 'ClaimableDraw [getUsersAddress] |') {
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
export async function initializeClaimableDraws(
  signersOrProviders: { [chainId: number]: Provider | Signer },
  linkedPrizePoolContractList: ContractList
): Promise<ClaimableDraw[] | null> {
  const contracts = linkedPrizePoolContractList.contracts
  const claimableDrawContracts = getContractsByType(contracts, ContractType.ClaimableDraw)
  const claimableDrawContractsByChainId = sortContractsByChainId(claimableDrawContracts)
  const chainIds = Object.keys(claimableDrawContractsByChainId).map(Number)

  // Fetch addresses for relationships between claimable draws and child contracts
  const claimableDrawAddressBatchRequestPromises = chainIds.map((chainId) =>
    fetchClaimableDrawAddressesByChainId(
      chainId,
      signersOrProviders[chainId],
      claimableDrawContractsByChainId[chainId]
    )
  )
  const claimableDrawAddressesResponses = await Promise.allSettled(
    claimableDrawAddressBatchRequestPromises
  )
  const claimableDrawAddresses: {
    chainId: number
    addressesByClaimableDraw: { [address: string]: { [key: string]: string } }
  }[] = []
  claimableDrawAddressesResponses.forEach((response) => {
    if (response.status === 'fulfilled') {
      claimableDrawAddresses.push(response.value)
    } else {
      console.error('Fetching contract addresses failed with error: ', response.reason)
    }
  })

  // Sort children addresses by chain id
  const claimableDrawAddressesByChainId: ChildContractAddresses = {}
  claimableDrawAddresses.forEach(
    (addressessResponse) =>
      (claimableDrawAddressesByChainId[addressessResponse.chainId] =
        addressessResponse.addressesByClaimableDraw)
  )

  // Extend contracts with children
  const contractsWithChildren = extendContractWithChildren(
    contracts,
    claimableDrawAddressesByChainId,
    ContractType.ClaimableDraw
  )

  // Sort contract lists
  const sortedContractLists = sortContractsByContractTypeAndChildren(
    contractsWithChildren,
    ContractType.ClaimableDraw
  )

  // Need to inject some more contracts since they get linked later
  // TODO: Need to properly match these contracts
  // - DrawHistory
  // - TsunamiDrawSettingsHistory
  // - Ticket
  const finalContractLists: ContractMetadata[][] = []
  sortedContractLists.forEach((contractList) => {
    const chainId = contractList[0].chainId

    // DrawHistory
    const drawHistoryMetadatas = getContractsByType(contracts, ContractType.DrawHistory)
    const drawHistoryMetadata = drawHistoryMetadatas.find(
      (contract) => contract.chainId === chainId
    )

    // TsunamiDrawSettingsHistory
    const drawSettingsHistoryMetadatas = getContractsByType(
      contracts,
      ContractType.TsunamiDrawSettingsHistory
    )
    const drawSettingsMetadata = drawSettingsHistoryMetadatas.find(
      (contract) => contract.chainId === chainId
    )

    // Ticket
    const ticketMetadatas = getContractsByType(contracts, ContractType.Ticket)
    const ticketMetadata = ticketMetadatas.find((contract) => contract.chainId === chainId)

    // Push contracts
    const newContractList: ContractMetadata[] = [...contractList]
    if (drawHistoryMetadata) newContractList.push(drawHistoryMetadata)
    if (ticketMetadata) newContractList.push(ticketMetadata)
    if (drawSettingsMetadata) newContractList.push(drawSettingsMetadata)
    finalContractLists.push(newContractList)
  })

  return finalContractLists.map((contractList) => {
    const chainId = contractList[0].chainId
    return new ClaimableDraw(signersOrProviders[chainId], contractList)
  })
}

/**
 * Fetches relevant addresses from the ClaimableDraw to match with the provided contract list.
 * - DrawCalculator
 * @param chainId
 * @param signerOrProvider
 * @param claimableDrawContracts
 * @returns
 */
async function fetchClaimableDrawAddressesByChainId(
  chainId: number,
  signerOrProvider: Signer | Provider,
  claimableDrawContracts: ContractMetadata[]
) {
  const batchCalls = [] as Context[]
  claimableDrawContracts.forEach((claimableDrawContract) => {
    const claimableDrawEtherplexContract = etherplexContract(
      claimableDrawContract.address,
      claimableDrawContract.abi,
      claimableDrawContract.address
    )
    // @ts-ignore: Property doesn't exist on MulticallContract
    batchCalls.push(claimableDrawEtherplexContract.getDrawCalculator())
  })
  const result = await batch(signerOrProvider as BaseProvider, ...batchCalls)
  const addressesByClaimableDraw = {} as { [address: string]: { [key: string]: string } }
  Object.keys(result).forEach(
    (claimableDrawAddress: any) =>
      (addressesByClaimableDraw[claimableDrawAddress] = {
        drawCalculator: result[claimableDrawAddress].getDrawCalculator[0]
      })
  )
  return { chainId, addressesByClaimableDraw }
}

//////////////////////////// Temporary Methods ////////////////////////////
