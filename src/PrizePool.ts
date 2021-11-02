import { Provider } from '@ethersproject/abstract-provider'
import { Contract } from '@ethersproject/contracts'
import { MaxUint256 } from '@ethersproject/constants'
import { Contract as ContractMetadata } from '@pooltogether/contract-list-schema'
import { PrizePoolTokenBalances, TokenData } from './types'
import { ContractType } from './constants'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/BigNumber'
import { getTokenData, getUsersERC20Balance } from './utils/contractGetters'
import { validateAddress, validateSignerOrProviderNetwork } from './utils/validation'
import { getMetadataAndContract } from './utils/getMetadataAndContract'

/**
 * A Prize Pool.
 * Provides read only functions for getting data needed to display to users.
 *
 * NOTE: Initialization is still up in the air since the way we're using
 * contract lists to store Linked Prize Pool data is constantly changing.
 */
export class PrizePool {
  readonly contractMetadataList: ContractMetadata[]
  readonly signerOrProvider: Provider | Signer
  readonly chainId: number
  readonly address: string

  // Contract metadata
  readonly prizePoolMetadata: ContractMetadata
  readonly ticketMetadata: ContractMetadata
  readonly tokenMetadata: ContractMetadata

  // Ethers contracts
  readonly prizePoolContract: Contract
  readonly ticketContract: Contract
  readonly tokenContract: Contract

  /**
   * NOTE: Assumes a list of only the relevant contracts was provided.
   * Meaning there is only 1 "Ticket", 1 "YieldSourcePrizePool", etc. in the list.
   * @constructor
   * @param signerOrProvider
   * @param contractMetadataList a filtered list of relevant contract metadata.
   */
  constructor(signerOrProvider: Provider | Signer, contractMetadataList: ContractMetadata[]) {
    // Get contract metadata & ethers contracts
    const [prizePoolContractMetadata, prizePoolContract] = getMetadataAndContract(
      signerOrProvider,
      ContractType.YieldSourcePrizePool,
      contractMetadataList
    )
    const [ticketContractMetadata, ticketContract] = getMetadataAndContract(
      signerOrProvider,
      ContractType.Ticket,
      contractMetadataList
    )
    const [tokenContractMetadata, tokenContract] = getMetadataAndContract(
      signerOrProvider,
      ContractType.Token,
      contractMetadataList
    )

    // Set data
    this.contractMetadataList = contractMetadataList
    this.signerOrProvider = signerOrProvider
    this.chainId = prizePoolContractMetadata.chainId
    this.address = prizePoolContractMetadata.address

    // Set metadata
    this.prizePoolMetadata = prizePoolContractMetadata
    this.ticketMetadata = ticketContractMetadata
    this.tokenMetadata = tokenContractMetadata

    // Set ethers contracts
    this.prizePoolContract = prizePoolContract
    this.ticketContract = ticketContract
    this.tokenContract = tokenContract
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  /**
   * Returns a users balances for the Prize Pool Token and Ticket.
   * @param usersAddress string
   * @returns token: BigNumber, ticket: BigNumber
   */
  async getUsersPrizePoolBalances(usersAddress: string): Promise<PrizePoolTokenBalances> {
    const errorPrefix = 'PrizePool [getUsersPrizePoolBalances] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    const tokenBalancePromise = getUsersERC20Balance(usersAddress, this.tokenContract)
    const ticketBalancePromise = getUsersERC20Balance(usersAddress, this.ticketContract)
    const [token, ticket] = await Promise.all([tokenBalancePromise, ticketBalancePromise])
    return {
      token,
      ticket
    }
  }

  /**
   * Returns a users Ticket balance.
   * @param usersAddress string
   * @returns BigNumber
   */
  async getUsersTicketBalance(usersAddress: string): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getUsersTicketBalance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    return getUsersERC20Balance(usersAddress, this.ticketContract)
  }

  /**
   * Returns a users Ticket TWAB at a specific timestamp.
   * @param usersAddress string
   * @param timestamp number
   * @returns BigNumber
   */
  async getUsersTicketTwabAt(usersAddress: string, timestamp: number): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getUsersTicketBalance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    const result = await this.ticketContract.functions.getBalanceAt(usersAddress, timestamp)
    const balance: BigNumber = result[0]
    return balance
  }

  /**
   * Returns a users Token (underlying token) balance.
   * @param usersAddress string
   * @returns BigNumber
   */
  async getUsersTokenBalance(usersAddress: string): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getUsersTokenBalance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    return getUsersERC20Balance(usersAddress, this.tokenContract)
  }

  /**
   * Fetches a users deposit allowance for the Prize Pool.
   * @param usersAddress string
   * @returns allowanceUnformatted: BigNumber, isApproved: boolean
   */
  async getUsersDepositAllowance(usersAddress: string) {
    const errorPrefix = 'PrizePool [getUsersDepositAllowance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    const prizePoolAddress = this.prizePoolMetadata.address
    const result = await this.tokenContract.functions.allowance(usersAddress, prizePoolAddress)
    const allowanceUnformatted: BigNumber = result[0]
    return { allowanceUnformatted, isApproved: !allowanceUnformatted.isZero() }
  }

  async getUsersTicketDelegate(usersAddress: string) {
    const errorPrefix = 'PrizePool [getUsersTicketDelegate] | '
    await validateAddress(errorPrefix, usersAddress)

    const result = await this.ticketContract.functions.delegateOf(usersAddress)
    return result[0]
  }

  /**
   * Fetches decimals, name and symbol for the Token (underlying).
   * @returns symbol: string, decimals: string, name: string
   */
  async getTokenData(): Promise<TokenData> {
    const errorPrefix = 'PrizePool [getTokenData] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    return getTokenData(this.tokenContract)
  }

  /**
   * Fetches decimals, name and symbol for the Ticket.
   * @returns symbol: string, decimals: string, name: string
   */
  async getTicketData(): Promise<TokenData> {
    const errorPrefix = 'PrizePool [getTicketData] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    return getTokenData(this.ticketContract)
  }

  /**
   * Fetches total supply for the Ticket.
   * @returns symbol: string, decimals: string, name: string
   */
  async getTicketTotalSupply(): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getTicketData] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const result = await this.ticketContract.functions.totalSupply()
    const totalSupply: BigNumber = result[0]
    return totalSupply
  }

  /**
   * Fetches a gas estimate for depositing from the Prize Pool.
   * @param usersAddress string
   * @param amount BigNumber
   * @returns BigNumber
   */
  async getDepositGasEstimate(usersAddress: string, amount: BigNumber): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getUsersDepositAllowance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    return await this.prizePoolContract.estimateGas.depositTo(usersAddress, amount)
  }

  /**
   * Fetches a gas estimate for withdrawing from the Prize Pool.
   * @param usersAddress string
   * @param amount BigNumber
   * @returns BigNumber
   */
  async getWithdrawGasEstimate(usersAddress: string, amount: BigNumber): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getWithdrawGasEstimate] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    return await this.prizePoolContract.estimateGas.withdrawFrom(usersAddress, amount)
  }

  /**
   * Fetches a gas estimate for approving deposits into the Prize Pool.
   * @param usersAddress string
   * @returns BigNumber
   */
  async getApprovalGasEstimate(usersAddress: string): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getApprovalGasEstimate] | '
    await validateAddress(errorPrefix, usersAddress)

    const prizePoolAddress = this.prizePoolMetadata.address
    return await this.tokenContract.estimateGas.approve(prizePoolAddress, MaxUint256)
  }

  //////////////////////////// Methods ////////////////////////////

  /**
   * Returns a unique id string for this Prize Pool.
   * @returns string
   */
  id(): string {
    return `${this.prizePoolMetadata.address}-${this.prizePoolMetadata.chainId}`
  }
}
