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
 * Provides read only functions for the contracts that make up the deployment of this Prize Pool.
 */
export class PrizePool {
  readonly contractMetadataList: ContractMetadata[]
  readonly signerOrProvider: Provider | Signer
  readonly chainId: number
  readonly address: string

  // Contract metadata
  readonly prizePoolMetadata: ContractMetadata
  readonly eip2612PermitAndDepositMetadata: ContractMetadata | undefined
  ticketMetadata: ContractMetadata | undefined
  tokenMetadata: ContractMetadata | undefined

  // Ethers contracts
  readonly prizePoolContract: Contract
  readonly eip2612PermitAndDepositContract: Contract | undefined
  ticketContract: Contract | undefined
  tokenContract: Contract | undefined

  /**
   * Create an instance of a PrizePool by providing the metadata for the YieldSourcePrizePool contract, an ethers Provider or Signer for the network the Prize Pool is deployed on and a list of contract metadata for the other contracts that make up the Prize Pool.
   * @constructor
   * @param prizePoolMetadata the metadata for the YieldSourcePrizePool contract in the Prize Pool
   * @param signerOrProvider a Provider or Signer for the network the Prize Pool deployment is on
   * @param contractMetadataList an array of metadata for the Prize Pool
   */
  constructor(
    prizePoolMetadata: ContractMetadata,
    signerOrProvider: Provider | Signer,
    contractMetadataList: ContractMetadata[]
  ) {
    // Set basic data
    this.contractMetadataList = contractMetadataList
    this.signerOrProvider = signerOrProvider
    this.chainId = prizePoolMetadata.chainId
    this.address = prizePoolMetadata.address

    // Get prizePool ethers contract
    const prizePoolContract = new Contract(
      this.address,
      prizePoolMetadata.abi,
      this.signerOrProvider
    )

    // Get eip2612PermitAndDeposit metadata & ethers contracts
    const eip2612PermitAndDeposit = getMetadataAndContract(
      this.chainId,
      this.signerOrProvider,
      ContractType.EIP2612PermitAndDeposit,
      this.contractMetadataList
    )

    // Set metadata
    this.prizePoolMetadata = prizePoolMetadata
    this.eip2612PermitAndDepositMetadata = eip2612PermitAndDeposit.contractMetadata
    this.ticketMetadata = undefined
    this.tokenMetadata = undefined

    // Set ethers contracts
    this.prizePoolContract = prizePoolContract
    this.eip2612PermitAndDepositContract = eip2612PermitAndDeposit.contract
    this.ticketContract = undefined
    this.tokenContract = undefined
  }

  /**
   * Returns a unique id string for this Prize Pool.
   * @returns a unique id for the Prize Pool
   */
  id(): string {
    return `${this.prizePoolMetadata.address}-${this.prizePoolMetadata.chainId}`
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
   * @param startTimestamp the start timestamp to fetch in seconds
   * @param endTimestamp the end timestamp to fetch in seconds
   * @returns the users TWAB between the requested times
   */
  async getUsersAverageBalanceBetween(
    usersAddress: string,
    startTimestamp: number,
    endTimestamp: number
  ): Promise<BigNumber> {
    const errorPrefix = 'PrizePool [getUsersAverageBalanceBetween] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const ticketContract = await this.getTicketContract()

    const result = await ticketContract.functions.getAverageBalanceBetween(
      usersAddress,
      startTimestamp,
      endTimestamp
    )
    const twab: BigNumber = result[0]
    return twab
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

  // NOTE: Gas estimates are commented out as they are quite unreliable.

  /**
   * Fetches a gas estimate for depositing from the Prize Pool.
   * @param usersAddress string
   * @param amount BigNumber
   * @returns BigNumber
   */
  // async getDepositGasEstimate(usersAddress: string, amount: BigNumber): Promise<BigNumber> {
  //   const errorPrefix = 'PrizePool [getUsersDepositAllowance] | '
  //   await validateAddress(errorPrefix, usersAddress)
  //   await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

  //   return await this.prizePoolContract.estimateGas.depositTo(usersAddress, amount)
  // }

  /**
   * Fetches a gas estimate for withdrawing from the Prize Pool.
   * @param usersAddress string
   * @param amount BigNumber
   * @returns BigNumber
   */
  // async getWithdrawGasEstimate(usersAddress: string, amount: BigNumber): Promise<BigNumber> {
  //   const errorPrefix = 'PrizePool [getWithdrawGasEstimate] | '
  //   await validateAddress(errorPrefix, usersAddress)
  //   await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

  //   return await this.prizePoolContract.estimateGas.withdrawFrom(usersAddress, amount)
  // }

  /**
   * Fetches a gas estimate for approving deposits into the Prize Pool.
   * @param usersAddress string
   * @returns BigNumber
   */
  // async getApprovalGasEstimate(usersAddress: string): Promise<BigNumber> {
  //   const errorPrefix = 'PrizePool [getApprovalGasEstimate] | '
  //   await validateAddress(errorPrefix, usersAddress)
  //   const tokenContract = await this.getTokenContract()

  //   const prizePoolAddress = this.prizePoolMetadata.address
  //   return await tokenContract.estimateGas.approve(prizePoolAddress, MaxUint256)
  // }

  //////////////////////////// Ethers Contracts Initializers ////////////////////////////

  /**
   * Fetches the addresses to build an instance of an ethers Contract for the Ticket
   * @returns an ethers contract for the ticket
   */
  async getTicketContract(): Promise<Contract> {
    if (this.ticketContract !== undefined) return this.ticketContract
    const getAddress = async () => {
      const result: Result = await this.prizePoolContract.functions.getTicket()
      return result[0]
    }
    const ticketAddress = await getAddress()
    const { contractMetadata: ticketMetadata, contract: ticketContract } = getMetadataAndContract(
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
