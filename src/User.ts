import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract as ContractMetadata } from '@pooltogether/contract-list-schema'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { MaxUint256 } from '@ethersproject/constants'
import { PrizePool } from './PrizePool'
import { validateAddress, validateSignerNetwork } from './utils'
import { Overrides } from '@ethersproject/contracts'

/**
 * A User for a Prize Pool.
 * Provides read & write functionality for a Prize Pool.
 * Reads use the provider from the PrizePool.
 * Writes use the signer from the contructor.
 * Throws an error if a write is trigger with a signer on an
 * incorrect network.
 * @extends PrizePool
 */
export class User extends PrizePool {
  readonly signer: Signer

  /**
   * Creates an instance of a User for a specific PrizePool
   * @param signer Signer to submit transactions with
   * @param prizePool PrizePool that is relevant to this User
   */
  constructor(prizePoolMetadata: ContractMetadata, signer: Signer, prizePool: PrizePool) {
    super(prizePoolMetadata, signer, prizePool.contractMetadataList)

    this.signer = signer
  }

  //////////////////////////// Ethers write functions ////////////////////////////

  /**
   * Submits a transaction to withdraw a controlled token from the Prize Pool.
   * @param amount BigNumber
   * @param controlledTokenAddress string
   * @returns TransactionResponse
   */
  async withdraw(amount: BigNumber, overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'User [withdraw] | '
    await this.validateSignerNetwork(errorPrefix)

    const usersAddress = await this.signer.getAddress()
    if (Boolean(overrides)) {
      return this.prizePoolContract.withdrawFrom(usersAddress, amount, overrides)
    } else {
      return this.prizePoolContract.withdrawFrom(usersAddress, amount)
    }
  }

  /**
   * Submits a transaction to deposit a controlled token into the Prize Pool.
   * @param amount BigNumber
   * @param controlledTokenAddress string
   * @returns TransactionResponse
   */
  async deposit(amount: BigNumber, overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'User [depositTo] | '
    await this.validateSignerNetwork(errorPrefix)

    const usersAddress = await this.signer.getAddress()
    if (Boolean(overrides)) {
      return this.prizePoolContract.depositTo(usersAddress, amount, overrides)
    } else {
      return this.prizePoolContract.depositTo(usersAddress, amount)
    }
  }

  /**
   * Submits a transaction to deposit a controlled token into the Prize Pool.
   * @param amount BigNumber
   * @param controlledTokenAddress string
   * @returns TransactionResponse
   */
  async depositAndDelegate(
    amount: BigNumber,
    to?: string,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'User [depositToAndDelegate] | '
    await this.validateSignerNetwork(errorPrefix)
    if (to) {
      await validateAddress(errorPrefix, to)
    }

    const usersAddress = await this.signer.getAddress()
    if (Boolean(overrides)) {
      return this.prizePoolContract.depositToAndDelegate(
        usersAddress,
        amount,
        to || usersAddress,
        overrides
      )
    } else {
      return this.prizePoolContract.depositToAndDelegate(usersAddress, amount, to || usersAddress)
    }
  }

  /**
   * Submits a transaction to set an allowance for deposits into the Prize Pool.
   * @returns TransactionResponse
   */
  async approveDeposits(amount?: BigNumber, overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'User [approveDeposits] | '
    await this.validateSignerNetwork(errorPrefix)

    const prizePoolAddress = this.prizePoolMetadata.address
    const tokenContract = await this.getTokenContract()
    if (Boolean(overrides)) {
      return tokenContract.approve(prizePoolAddress, amount || MaxUint256, overrides)
    } else {
      return tokenContract.approve(prizePoolAddress, amount || MaxUint256)
    }
  }

  /**
   *
   * @returns
   */
  async selfDelegateTickets(overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'User [selfDelegateTickets] | '
    await this.validateSignerNetwork(errorPrefix)

    const usersAddress = await this.signer.getAddress()
    if (Boolean(overrides)) {
      return this.delegateTickets(usersAddress, overrides)
    } else {
      return this.delegateTickets(usersAddress)
    }
  }

  /**
   * Delegates ticket power to the provided address
   * @param address
   * @returns
   */
  async delegateTickets(address: string, overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'User [delegateTickets] | '
    await this.validateSignerNetwork(errorPrefix)
    await validateAddress(errorPrefix, address)

    const ticketContract = await this.getTicketContract()
    if (Boolean(overrides)) {
      return ticketContract.delegate(address, overrides)
    } else {
      return ticketContract.delegate(address)
    }
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  /**
   * Returns the Users ticket balance.
   * @returns BigNumber
   */
  async getTicketBalance(): Promise<BigNumber> {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersTicketBalance(usersAddress)
  }

  /**
   * Returns the Users token (underlying token) balance.
   * @returns BigNumber
   */
  async getTokenBalance(): Promise<BigNumber> {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersTokenBalance(usersAddress)
  }

  /**
   * Returns the allowance the User has for depositing into the Prize Pool.
   * @returns BigNumber
   */
  async getDepositAllowance() {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersDepositAllowance(usersAddress)
  }

  /**
   *
   * @returns
   */
  async getTicketDelegate() {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersTicketDelegate(usersAddress)
  }

  //////////////////////////// Utility methods ////////////////////////////

  /**
   * Validates the provided signers network.
   * Throws if it does not match the expected network.
   * @param errorPrefix string
   */
  async validateSignerNetwork(errorPrefix: string) {
    return validateSignerNetwork(errorPrefix, this.signer, this.chainId)
  }
}
