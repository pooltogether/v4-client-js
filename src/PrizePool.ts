import { Provider } from '@ethersproject/abstract-provider'
import { Contract } from '@ethersproject/contracts'
import { MaxUint256 } from '@ethersproject/constants'
import { Contract as ContractMetadata, ContractList } from '@pooltogether/contract-list-schema'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/BigNumber'
import { Result } from '@ethersproject/abi'

import { PrizePoolTokenBalances, Providers, TokenData } from './types'
import ERC20Abi from './abis/ERC20Abi'
import { ContractType } from './constants'
import {
  sortContractsByContractTypeAndChildren,
  getTokenData,
  getUsersERC20Balance,
  validateAddress,
  validateSignerOrProviderNetwork,
  getMetadataAndContract,
  createContractMetadata
} from './utils'

/**
 * A Prize Pool.
 * Provides read only functions for getting data needed to display to users.
 *
 * NOTE: Initialization is still up in the air since the way we're using
 * contract lists to store Prize Pool Network data is constantly changing.
 */
export class PrizePool {
  readonly contractMetadataList: ContractMetadata[]
  readonly signerOrProvider: Provider | Signer
  readonly chainId: number
  readonly address: string

  // Contract metadata
  readonly prizePoolMetadata: ContractMetadata
  ticketMetadata: ContractMetadata | undefined
  tokenMetadata: ContractMetadata | undefined

  // Ethers contracts
  readonly prizePoolContract: Contract
  ticketContract: Contract | undefined
  tokenContract: Contract | undefined

  /**
   * NOTE: Assumes a list of only the relevant contracts was provided.
   * Meaning there is only 1 "Ticket", 1 "YieldSourcePrizePool", etc. in the list.
   * @constructor
   * @param signerOrProvider
   * @param contractMetadataList a filtered list of relevant contract metadata.
   */
  constructor(
    prizePoolMetadata: ContractMetadata,
    signerOrProvider: Provider | Signer,
    contractMetadataList: ContractMetadata[]
  ) {
    // Get contract metadata & ethers contracts
    const prizePoolContract = new Contract(
      prizePoolMetadata.address,
      prizePoolMetadata.abi,
      signerOrProvider
    )

    // Set data
    this.contractMetadataList = contractMetadataList
    this.signerOrProvider = signerOrProvider
    this.chainId = prizePoolMetadata.chainId
    this.address = prizePoolMetadata.address

    // Set metadata
    this.prizePoolMetadata = prizePoolMetadata
    this.ticketMetadata = undefined
    this.tokenMetadata = undefined

    // Set ethers contracts
    this.prizePoolContract = prizePoolContract
    this.ticketContract = undefined
    this.tokenContract = undefined
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
   * Returns a users Ticket balance.
   * @param usersAddress string
   * @returns BigNumber
   */
  async getUsersTicketBalance(usersAddress: string): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getUsersTicketBalance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const ticketContract = await this.getTicketContract()

    return getUsersERC20Balance(usersAddress, ticketContract)
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
    const ticketContract = await this.getTicketContract()

    const result = await ticketContract.functions.getBalanceAt(usersAddress, timestamp)
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
    const tokenContract = await this.getTokenContract()

    return getUsersERC20Balance(usersAddress, tokenContract)
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
    const tokenContract = await this.getTokenContract()

    const prizePoolAddress = this.prizePoolMetadata.address
    const result = await tokenContract.functions.allowance(usersAddress, prizePoolAddress)
    const allowanceUnformatted: BigNumber = result[0]
    return { allowanceUnformatted, isApproved: !allowanceUnformatted.isZero() }
  }

  /**
   *
   * @param usersAddress
   * @returns
   */
  async getUsersTicketDelegate(usersAddress: string) {
    const errorPrefix = 'PrizePool [getUsersTicketDelegate] | '
    await validateAddress(errorPrefix, usersAddress)
    const ticketContract = await this.getTicketContract()

    const result = await ticketContract.functions.delegateOf(usersAddress)
    return result[0]
  }

  /**
   * Fetches decimals, name and symbol for the Token (underlying).
   * @returns symbol: string, decimals: string, name: string
   */
  async getTokenData(): Promise<TokenData> {
    const errorPrefix = 'PrizePool [getTokenData] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const tokenContract = await this.getTokenContract()

    return getTokenData(tokenContract)
  }

  /**
   * Fetches decimals, name and symbol for the Ticket.
   * @returns symbol: string, decimals: string, name: string
   */
  async getTicketData(): Promise<TokenData> {
    const errorPrefix = 'PrizePool [getTicketData] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const ticketContract = await this.getTicketContract()

    return getTokenData(ticketContract)
  }

  /**
   * Fetches total supply for the Ticket.
   * @returns symbol: string, decimals: string, name: string
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
    const tokenContract = await this.getTokenContract()

    const prizePoolAddress = this.prizePoolMetadata.address
    return await tokenContract.estimateGas.approve(prizePoolAddress, MaxUint256)
  }

  //////////////////////////// Methods ////////////////////////////

  /**
   * Returns a unique id string for this Prize Pool.
   * @returns string
   */
  id(): string {
    return `${this.prizePoolMetadata.address}-${this.prizePoolMetadata.chainId}`
  }

  //////////////////////////// Ethers Contracts Initializers ////////////////////////////

  /**
   *
   * @returns
   */
  async getTicketContract(): Promise<Contract> {
    if (this.ticketContract !== undefined) return this.ticketContract
    const getAddress = async () => {
      const result: Result = await this.prizePoolContract.functions.getTicket()
      return result[0]
    }
    const ticketAddress = await getAddress()
    console.log('getTicketContract', {
      chainId: this.chainId,
      signerOrProvider: this.signerOrProvider,
      type: ContractType.Ticket,
      contracts: this.contractMetadataList,
      address: ticketAddress
    })
    const [ticketMetadata, ticketContract] = getMetadataAndContract(
      this.chainId,
      this.signerOrProvider,
      ContractType.Ticket,
      this.contractMetadataList,
      ticketAddress
    )
    this.ticketMetadata = ticketMetadata
    this.ticketContract = ticketContract
    return ticketContract
  }

  /**
   *
   * @returns
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
}

/**
 * Utility function to create several PrizePools from a contract list.
 * @param providers
 * @param contracts
 * @returns
 */
export function initializePrizePools(
  contractList: ContractList,
  providers: Providers
): PrizePool[] {
  const prizePoolContractLists = sortContractsByContractTypeAndChildren(
    contractList.contracts,
    ContractType.YieldSourcePrizePool
  )
  const prizePools: PrizePool[] = []
  prizePoolContractLists.forEach((contracts) => {
    const prizePoolMetadata = contracts.find(
      (contract) => contract.type === ContractType.YieldSourcePrizePool
    ) as ContractMetadata
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
