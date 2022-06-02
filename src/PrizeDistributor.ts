import { Result } from '@ethersproject/abi'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { Contract } from '@ethersproject/contracts'
import { BigNumber } from 'ethers'

import ERC20Abi from './abis/ERC20Abi'
import { ContractType } from './constants'
import { ContractWrapper } from './ContractWrapper'
import { Contract as ContractMetadata, Draw, TokenData } from './types'
import {
  createContractMetadata,
  getTokenData,
  validateAddress,
  validateIsSigner,
  validateSignerNetwork
} from './utils'

/**
 * A Prize Distributor abstract class.
 * Provides access to the contracts for viewing expiration times on draws, timelock timers and checking/claiming prizes for a user. Can be instantiated with an ethers Signer or Provider. Use a Signer if you want to claim transactions for a user. If a provider is provided, only read methods are available.
 */
export abstract class PrizeDistributor extends ContractWrapper {
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
   * Fetches the newest Draw in the DrawBuffer related to the PrizeDistributorV2.
   * NOTE: Will throw an error if the buffer is empty.
   * @returns the newest draw in the draw buffer
   */
  async getNewestDraw(): Promise<Draw> {
    const drawBufferContract = await this.getDrawBufferContract()
    const result: Result = await drawBufferContract.functions.getNewestDraw()
    const draw = result[0]
    return {
      timestamp: draw.timestamp,
      drawId: draw.drawId,
      winningRandomNumber: draw.winningRandomNumber,
      beaconPeriodStartedAt: draw.beaconPeriodStartedAt,
      beaconPeriodSeconds: draw.beaconPeriodSeconds
    }
  }

  /**
   * Fetches the oldest Draw in the DrawBuffer related to the PrizeDistributorV2.
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
   * Fetches the amount of tokens a user claimed for a draw.
   * @param usersAddress the address of the user to check
   * @param drawId the draw id to check
   * @returns the amount a user claimed
   */
  async getUsersClaimedAmount(usersAddress: string, drawId: number): Promise<BigNumber> {
    const errorPrefix = 'PrizeDistributorV2 [getUsersClaimedAmount] |'
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
   * @returns an ethers Contract for the DrawCalculator related to this PrizeDistributorV2
   */
  abstract getDrawCalculatorContract(): Promise<Contract>

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
   * Fetches the address of the DrawBeacon and caches the ethers Contract for the DrawBeacon.
   * @returns an ethers Contract for the DrawBeacon related to this PrizeDistributorV2
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
   * Fetches the address of the Token that is distributed by this PrizeDistributorV2 and caches the ethers Contract for the ERC20 Token.
   * @returns an ethers Contract for the ERC20 Token related to this PrizeDistributorV2
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
   * PrizeDistributorV2 can be initialized with a Signer.
   * @param errorPrefix the class and function name of where the error occurred
   * @returns the address of the user
   */
  async getUsersAddress(errorPrefix = 'PrizeDistributorV2 [getUsersAddress] |') {
    await this.validateIsSigner(errorPrefix)
    return await (this.signerOrProvider as Signer).getAddress()
  }

  //////////////////////////// Validation methods ////////////////////////////

  /**
   * Validates that a Signer is on the network the PrizeDistributorV2 is deployed on.
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
