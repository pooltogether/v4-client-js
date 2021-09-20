import { Contract, Event } from '@ethersproject/contracts'
import { Result } from '@ethersproject/abi'
import { ContractType } from './constants'
import { Contract as ContractMetadata, ContractList } from './types'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { contract as etherplexContract, batch, Context } from '@pooltogether/etherplex'
import { BaseProvider, TransactionResponse } from '@ethersproject/providers'
import {
  ChildContractAddresses,
  extendContractWithChildren
} from './utils/extendContractWithChildren'
import { getMetadataAndContract } from './utils/getMetadataAndContract'
import { Claim, Draw, DrawResults, DrawSettings } from 'tempTypes'
import { BigNumber } from '@ethersproject/bignumber'
import {
  generatePicks,
  computeDrawResults,
  prepareClaimForUserFromDrawResult
} from '@pooltogether/draw-calculator-js-sdk'
import { getContractsByType } from './utils/getContractsByType'
import { sortContractsByChainId } from './utils/sortContractsByChainId'
import { sortContractsByContractTypeAndChildren } from './utils/sortContractsByContractTypeAndChildren'
import { validateIsSigner, validateSignerNetwork } from 'utils/validation'

/**
 * Can be instantiated with a signer or a provider.
 * If a provider is provided, only read methods are available.
 */
export class ClaimableDraw {
  readonly signerOrProvider: Provider | Signer
  readonly contractMetadataList: ContractMetadata[]
  readonly chainId: number
  readonly address: string

  // Contract metadata
  readonly claimableDraw: ContractMetadata
  readonly drawHistory: ContractMetadata

  // Ethers contracts
  readonly claimableDrawContract: Contract
  readonly drawHistoryContract: Contract

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
    const [drawHistoryContractMetadata, drawHistoryContract] = getMetadataAndContract(
      signerOrProvider,
      ContractType.DrawHistory,
      contractMetadataList
    )

    // Set data
    this.signerOrProvider = signerOrProvider
    this.contractMetadataList = contractMetadataList
    this.chainId = claimableDrawContractMetadata.chainId
    this.address = claimableDrawContractMetadata.address

    // Set metadata
    this.claimableDraw = claimableDrawContractMetadata
    this.drawHistory = drawHistoryContractMetadata

    // Set ethers contracts
    this.claimableDrawContract = claimableDrawContract
    this.drawHistoryContract = drawHistoryContract
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

    const claim: Claim = prepareClaimForUserFromDrawResult({ address: usersAddress }, drawResults)
    return this.claimableDrawContract.claim(claim.userAddress, claim.drawIds, claim.data)
  }

  /**
   *
   * @returns
   */
  async getClaimedEvents() {
    const errorPrefix = 'ClaimableDraw [getClaimedEvents] |'
    const usersAddress = await this.getUsersAddress(errorPrefix)

    return this.getUsersClaimedEvents(usersAddress)
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  // NOTE: getNewestDraw will error if there is no draw pushed
  // Use to check if draw is ready?
  async getNewestDraw(): Promise<Draw> {
    try {
      const result: Result = await this.drawHistoryContract.getNewestDraw()
      return {
        winningRandomNumber: result[0],
        timestamp: result[1],
        drawId: result[2]
      } as Draw
    } catch (e) {
      console.warn(e)
      return null
    }
  }

  // TODO: Double check
  async getDraws(): Promise<Draw[]> {
    const response: Result = await this.drawHistoryContract.functions.draws()
    return response as Draw[]
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
    const [drawIndex] = await this.drawHistoryContract.functions.drawIdToDrawIndex(draw.drawId)
    // NOTE: drawCalculatorAddresses should accept the drawId not index.

    // Fetch draw calculator address for the draw
    // TODO: Need to identify what draw calculator ABI matches
    const [
      drawCalculatorAddress
    ] = await this.claimableDrawContract.functions.drawCalculatorAddresses(drawIndex)
    const [, drawCalculatorContract] = getMetadataAndContract(
      this.signerOrProvider,
      ContractType.TsunamiDrawCalculator,
      this.contractMetadataList,
      drawCalculatorAddress
    )

    // Fetch the draw settings for the draw
    const drawSettingsResult: Result = await drawCalculatorContract.functions.getDrawSettings(
      draw.drawId
    )
    const drawSettings: DrawSettings = drawSettingsResult[0]

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

    if (balance.isZero()) {
      return null
    } else {
      const picks = generatePicks(drawSettings.pickCost, usersAddress, balance)
      // finally call function
      const drawResults = computeDrawResults(drawSettings, draw, picks)
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
      console.warn('Fetching contract addresses failed with error: ', response.reason)
    }
  })

  // Sort children addresses by chain id
  const claimableDrawAddressesByChainId: ChildContractAddresses = {}
  claimableDrawAddresses.forEach(
    (ppa) => (claimableDrawAddressesByChainId[ppa.chainId] = ppa.addressesByClaimableDraw)
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
  // TsunamiDrawCalculator
  // Ticket
  const finalContractLists = []
  sortedContractLists.forEach((contractList) => {
    const chainId = contractList[0].chainId
    // TsunamiDrawCalculator
    const tsunamiDrawCalculatorMetadatas = getContractsByType(
      contracts,
      ContractType.TsunamiDrawCalculator
    )
    const tsunamiDrawCalculatorMetadata = tsunamiDrawCalculatorMetadatas.find(
      (contract) => contract.chainId === chainId
    )
    // Ticket
    const ticketMetadatas = getContractsByType(contracts, ContractType.Ticket)
    const ticketMetadata = ticketMetadatas.find((contract) => contract.chainId === chainId)
    // Push contracts
    finalContractLists.push([...contractList, tsunamiDrawCalculatorMetadata, ticketMetadata])
  })

  return finalContractLists.map((contractList) => {
    const chainId = contractList[0].chainId
    return new ClaimableDraw(signersOrProviders[chainId], contractList)
  })
}

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
    batchCalls.push(claimableDrawEtherplexContract.drawHistory())
  })
  const result = await batch(signerOrProvider as BaseProvider, ...batchCalls)
  const addressesByClaimableDraw = {} as { [address: string]: { [key: string]: string } }
  Object.keys(result).forEach(
    (claimableDrawAddress: any) =>
      (addressesByClaimableDraw[claimableDrawAddress] = {
        drawHistory: result[claimableDrawAddress].drawHistory[0]
      })
  )
  return { chainId, addressesByClaimableDraw }
}
