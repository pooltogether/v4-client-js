import { Result } from '@ethersproject/abi'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Contract as ContractMetadata, ContractList } from '@pooltogether/contract-list-schema'

import ERC20Abi from './abis/ERC20Abi'
import { ContractType } from './constants'
import { PrizePoolTokenBalances, Providers, TokenData } from './types'
import {
  getTokenData,
  getUsersERC20Balance,
  validateAddress,
  validateSignerOrProviderNetwork,
  getMetadataAndContract,
  createContractMetadata,
  getContractsByType
} from './utils'
import { ContractWrapper } from './ContractWrapper'

/**
 * A Prize Pool.
 * Provides read only functions for the contracts that make up the deployment of this Prize Pool.
 */
export class PrizePool extends ContractWrapper {
  // Contract metadata
  readonly prizePoolMetadata: ContractMetadata
  readonly drawBeaconMetadata: ContractMetadata
  ticketMetadata: ContractMetadata | undefined
  tokenMetadata: ContractMetadata | undefined
  drawBufferMetadata: ContractMetadata | undefined

  // Ethers contracts
  readonly prizePoolContract: Contract
  readonly drawBeaconContract: Contract
  ticketContract: Contract | undefined
  tokenContract: Contract | undefined
  drawBufferContract: Contract | undefined

  /**
   * Create an instance of a PrizePool by providing the metadata for the YieldSourcePrizePool contract, an ethers Provider or Signer for the network the Prize Pool is deployed on and a list of contract metadata for the other contracts that make up the Prize Pool.
   * @constructor
   * @param prizePoolMetadata the metadata for the YieldSourcePrizePool contract in the Prize Pool
   * @param signerOrProvider a Provider or Signer for the network the Prize Pool deployment is on
   * @param contractMetadataList an array of metadata for the Prize Pool. Assumes there is a single DrawBeacon per chain id.
   */
  constructor(
    prizePoolMetadata: ContractMetadata,
    signerOrProvider: Provider | Signer,
    contractMetadataList: ContractMetadata[]
  ) {
    super(prizePoolMetadata, signerOrProvider, contractMetadataList)
    // Get contract metadata & ethers contracts
    const prizePoolContract = new Contract(
      prizePoolMetadata.address,
      prizePoolMetadata.abi,
      signerOrProvider
    )

    const {
      contractMetadata: drawBeaconMetadata,
      contract: drawBeaconContract
    } = getMetadataAndContract(
      prizePoolMetadata.chainId,
      signerOrProvider,
      ContractType.DrawBeacon,
      contractMetadataList
    )

    // Set metadata
    this.prizePoolMetadata = prizePoolMetadata
    this.drawBeaconMetadata = drawBeaconMetadata
    this.ticketMetadata = undefined
    this.tokenMetadata = undefined

    // Set ethers contracts
    this.prizePoolContract = prizePoolContract
    this.drawBeaconContract = drawBeaconContract
    this.ticketContract = undefined
    this.tokenContract = undefined
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  /**
   * Fetches a users balances for the Prize Pool underlying Token and Ticket.
   * @param usersAddress the users address to fetch balances for
   * @returns the users balances for the underlying deposit token and the ticket token
   */
  async getUsersPrizePoolBalances(usersAddress: string): Promise<PrizePoolTokenBalances> {
    const errorPrefix = 'PrizePool [getUsersPrizePoolBalances] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const tokenContract = await this.getTokenContract()
    const ticketContract = await this.getTicketContract()

    const tokenBalancePromise = getUsersERC20Balance(usersAddress, tokenContract)
    const ticketBalancePromise = getUsersERC20Balance(usersAddress, ticketContract)
    const [token, ticket] = await Promise.all([tokenBalancePromise, ticketBalancePromise])
    return {
      token,
      ticket
    }
  }

  /**
   * Fetches a users balance for the Prize Pools Ticket.
   * @param usersAddress the address to fetch the balance for
   * @returns the users ticket balance
   */
  async getUsersTicketBalance(usersAddress: string): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getUsersTicketBalance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const ticketContract = await this.getTicketContract()

    return getUsersERC20Balance(usersAddress, ticketContract)
  }

  /**
   * Fetches a users Ticket TWAB at a specific unix timestamp.
   * @param usersAddress the address to fetch the ticket TWAB for
   * @param unixTimestamp the unix timestamp to fetch in seconds
   * @returns the users TWAB at the requested time
   */
  async getUsersTicketTwabAt(usersAddress: string, unixTimestamp: number): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getUsersTicketBalance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const ticketContract = await this.getTicketContract()

    const result = await ticketContract.functions.getBalanceAt(usersAddress, unixTimestamp)
    const twab: BigNumber = result[0]
    return twab
  }

  /**
   * Fetches a users balance for the Prize Pools underlying Token.
   * @param usersAddress the address to fetch the balance for
   * @returns the users token balance
   */
  async getUsersTokenBalance(usersAddress: string): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getUsersTokenBalance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const tokenContract = await this.getTokenContract()

    return getUsersERC20Balance(usersAddress, tokenContract)
  }

  /**
   * Fetches a users deposit allowance for the Prize Pool.
   * @param usersAddress the address to fetch the deposit allowance for
   * @returns the amount the user has approved for deposits
   */
  async getUsersDepositAllowance(usersAddress: string) {
    const errorPrefix = 'PrizePool [getUsersDepositAllowance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const tokenContract = await this.getTokenContract()

    const prizePoolAddress = this.prizePoolMetadata.address
    const result = await tokenContract.functions.allowance(usersAddress, prizePoolAddress)
    const allowanceUnformatted: BigNumber = result[0]
    return { allowanceUnformatted, isApproved: !allowanceUnformatted.isZero() }
  }

  /**
   * Fetches the address a user has delegated to.
   * @param usersAddress the address to fetch the delegate for
   * @returns the address a user has delegated to
   */
  async getUsersTicketDelegate(usersAddress: string): Promise<string> {
    const errorPrefix = 'PrizePool [getUsersTicketDelegate] | '
    await validateAddress(errorPrefix, usersAddress)
    const ticketContract = await this.getTicketContract()

    const result = await ticketContract.functions.delegateOf(usersAddress)
    return result[0]
  }

  /**
   * Fetches decimals, name and symbol for the underling Token.
   * @returns decimals, name and symbol for the underling token
   */
  async getTokenData(): Promise<TokenData> {
    const errorPrefix = 'PrizePool [getTokenData] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const tokenContract = await this.getTokenContract()

    return getTokenData(tokenContract)
  }

  /**
   * Fetches decimals, name and symbol for the Ticket.
   * @returns decimals, name and symbol for the ticket
   */
  async getTicketData(): Promise<TokenData> {
    const errorPrefix = 'PrizePool [getTicketData] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const ticketContract = await this.getTicketContract()

    return getTokenData(ticketContract)
  }

  /**
   * Fetches total supply for the Ticket.
   * @returns the total supply of the ticket
   */
  async getTicketTotalSupply(): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getTicketData] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const ticketContract = await this.getTicketContract()

    const result = await ticketContract.functions.totalSupply()
    const totalSupply: BigNumber = result[0]
    return totalSupply
  }

  /**
   * Fetches total supply for the Ticket accounting for the TWAB.
   * @param unixTimestamp the unix timestamp to fetch in seconds
   * @returns the ticket total supply TWAB at the requested time
   */
  async getTicketTwabTotalSupplyAt(unixTimestamp: number): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getTicketTwabTotalSupplyAt] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const ticketContract = await this.getTicketContract()

    const result = await ticketContract.functions.getTotalSupplyAt(unixTimestamp)
    const totalSupply: BigNumber = result[0]
    return totalSupply
  }

  /**
   * Fetch the current Draw Beacon period data from the beacon Prize Pool.
   * @returns the current draw beacon period.
   */
  async getDrawBeaconPeriod() {
    const [periodSecondsResult, periodStartedAtResult, nextDrawIdResult] = await Promise.all([
      this.drawBeaconContract.functions.getBeaconPeriodSeconds(),
      this.drawBeaconContract.functions.getBeaconPeriodStartedAt(),
      this.drawBeaconContract.functions.getNextDrawId()
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
   * Fetch the range of available draw ids in the Draw Buffer for the beacon Prize Pool.
   * @returns an array of draw ids
   */
  async getBeaconChainDrawIds(): Promise<number[]> {
    const drawBufferContract = await this.getDrawBufferContract()
    const [oldestDrawResponse, newestDrawResponse] = await Promise.allSettled([
      drawBufferContract.functions.getOldestDraw(),
      drawBufferContract.functions.getNewestDraw()
    ])

    if (newestDrawResponse.status === 'rejected' || oldestDrawResponse.status === 'rejected') {
      return []
    }

    const oldestId = oldestDrawResponse.value[0].drawId
    const newestId = newestDrawResponse.value[0].drawId

    const drawIds: number[] = []
    for (let i = oldestId; i <= newestId; i++) {
      drawIds.push(i)
    }

    return drawIds
  }

  //////////////////////////// Ethers Contracts Initializers ////////////////////////////

  /**
   * Fetches the addresses to build an instance of an ethers Contract for the Ticket
   * @returns an ethers contract for the ticket
   */
  async getTicketContract(): Promise<Contract> {
    const getAddress = async () => {
      const result: Result = await this.prizePoolContract.functions.getTicket()
      return result[0]
    }
    return this.getAndSetEthersContract('ticket', ContractType.Ticket, getAddress)
  }

  /**
   * Fetches the addresses to build an instance of an ethers Contract for the underlying Token
   * @returns an ethers contract for the underlying token
   */
  async getTokenContract(): Promise<Contract> {
    if (this.tokenContract !== undefined) return this.tokenContract
    const getAddress = async () => {
      const result: Result = await this.prizePoolContract.functions.getToken()
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
   * Fetches the addresses to build an instance of an ethers Contract for the draw buffer
   * @returns an ethers contract for the underlying token
   */
  async getDrawBufferContract(): Promise<Contract> {
    const getAddress = async () => {
      const result: Result = await this.drawBeaconContract.functions.getDrawBuffer()
      return result[0]
    }
    return this.getAndSetEthersContract('drawBuffer', ContractType.DrawBuffer, getAddress)
  }
}

/**
 * A utility function to create several PrizePools from a contract list.
 * @param contractList a list of all of the relevant contract metadata for all of the Prize Pools
 * @param providers providers for all of the networks in the list of Prize Pools
 * @returns a list of initialized PrizePools
 */
export function initializePrizePools(
  contractList: ContractList,
  providers: Providers
): PrizePool[] {
  const prizePoolMetadatas = getContractsByType(contractList.contracts, ContractType.PrizePool)
  const prizePools: PrizePool[] = []
  prizePoolMetadatas.forEach((prizePoolMetadata) => {
    const provider = providers[prizePoolMetadata.chainId]
    try {
      prizePools.push(new PrizePool(prizePoolMetadata, provider, contractList.contracts))
    } catch (e) {
      const error = e as Error
      console.error(error.message)
    }
  })

  return prizePools
}
