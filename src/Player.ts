import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { Overrides } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { MaxUint256 } from '@ethersproject/constants'
import { PrizePool } from './PrizePool'
import { validateAddress, validateSignerNetwork } from './utils/validation'

/**
 * A Player for a Prize Pool.
 * Provides read & write functionality for a Prize Pool.
 * Reads use the provider from the PrizePool.
 * Writes use the signer from the contructor.
 * Throws an error if a write is trigger with a signer on an
 * incorrect network.
 * @extends PrizePool
 */
export class Player extends PrizePool {
  readonly signer: Signer

  /**
   * Creates an instance of a Player for a specific PrizePool
   * @param signer Signer to submit transactions with
   * @param prizePool PrizePool that is relevant to this Player
   */
  constructor(signer: Signer, prizePool: PrizePool) {
    super(signer, prizePool.contractMetadataList)

    this.signer = signer
  }

  //////////////////////////// Wrapped ethers write functions ////////////////////////////

  //////////////////////////// Ethers write functions ////////////////////////////

  /**
   * Submits a transaction to withdraw a controlled token from the Prize Pool.
   * @param amount BigNumber
   * @param controlledTokenAddress string
   * @returns TransactionResponse
   */
  async withdraw(amount: BigNumber, overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'Player [withdraw] | '
    await this.validateSignerNetwork(errorPrefix)

    const usersAddress = await this.signer.getAddress()
    return this.prizePoolContract.withdrawFrom(usersAddress, amount, overrides)
  }

  /**
   * Submits a transaction to deposit a controlled token into the Prize Pool.
   * @param amount BigNumber
   * @param controlledTokenAddress string
   * @returns TransactionResponse
   */
  async deposit(amount: BigNumber, overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'Player [depositTo] | '
    await this.validateSignerNetwork(errorPrefix)

    const usersAddress = await this.signer.getAddress()
    return this.prizePoolContract.depositTo(usersAddress, amount, overrides)
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
    const errorPrefix = 'Player [depositToAndDelegate] | '
    await this.validateSignerNetwork(errorPrefix)
    if (to) {
      await validateAddress(errorPrefix, to)
    }

    const usersAddress = await this.signer.getAddress()
    return this.prizePoolContract.depositToAndDelegate(
      usersAddress,
      amount,
      to || usersAddress,
      overrides
    )
  }

  /**
   * Submits a transaction to set an allowance for deposits into the Prize Pool.
   * @returns TransactionResponse
   */
  async approveDeposits(): Promise<TransactionResponse> {
    const errorPrefix = 'Player [approveDeposits] | '
    await this.validateSignerNetwork(errorPrefix)

    const prizePoolAddress = this.prizePoolMetadata.address
    return this.tokenContract.approve(prizePoolAddress, MaxUint256)
  }

  /**
   *
   * @returns
   */
  async selfDelegateTickets(): Promise<TransactionResponse> {
    const errorPrefix = 'Player [selfDelegateTickets] | '
    await this.validateSignerNetwork(errorPrefix)

    const usersAddress = await this.signer.getAddress()
    return this.ticketContract.delegate(usersAddress)
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  /**
   * Returns the Players ticket balance.
   * @returns BigNumber
   */
  async getTicketBalance(): Promise<BigNumber> {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersTicketBalance(usersAddress)
  }

  /**
   * Returns the Players token (underlying token) balance.
   * @returns BigNumber
   */
  async getTokenBalance(): Promise<BigNumber> {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersTokenBalance(usersAddress)
  }

  /**
   * Returns the allowance the Player has for depositing into the Prize Pool.
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
