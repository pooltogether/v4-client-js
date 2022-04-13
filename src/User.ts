import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { Overrides } from '@ethersproject/contracts'
import { Contract as ContractMetadata } from '@pooltogether/contract-list-schema'

import { PrizePool } from './PrizePool'
import { validateAddress, validateSignerNetwork } from './utils'

/**
 * A User for a PrizePool.
 * Provides read & write functionality for a Prize Pool. Reads use the provider from the PrizePool. Writes use the signer from the contructor. Throws an error if a write is triggered with a signer that does not match the network of the Prize Pool.
 * @extends PrizePool
 */
export class User extends PrizePool {
  readonly signer: Signer

  /**
   * Creates an instance of a User for a specific PrizePool
   * @param signer signer to submit transactions with
   * @param prizePool PrizePool that the User should interact with
   */
  constructor(prizePoolMetadata: ContractMetadata, signer: Signer, prizePool: PrizePool) {
    super(prizePoolMetadata, signer, prizePool.contractMetadataList)

    this.signer = signer
  }

  //////////////////////////// Ethers write functions ////////////////////////////

  /**
   * Submits a transaction to withdraw a controlled token from the Prize Pool to the Signer.
   * @param amountUnformatted an unformatted and decimal shifted amount to withdraw from the prize pool
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async withdraw(
    amountUnformatted: BigNumber,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'User [withdraw]'
    await this.validateSignerNetwork(errorPrefix)

    const usersAddress = await this.signer.getAddress()
    if (Boolean(overrides)) {
      return this.prizePoolContract.withdrawFrom(usersAddress, amountUnformatted, overrides)
    } else {
      return this.prizePoolContract.withdrawFrom(usersAddress, amountUnformatted)
    }
  }

  /**
   * Submits a transaction to deposit a controlled token into the Prize Pool to the Signer.
   * @param amountUnformatted an unformatted and decimal shifted amount to deposit from the prize pool
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async deposit(amountUnformatted: BigNumber, overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'User [depositTo]'
    await this.validateSignerNetwork(errorPrefix)

    const usersAddress = await this.signer.getAddress()
    if (Boolean(overrides)) {
      return this.prizePoolContract.depositTo(usersAddress, amountUnformatted, overrides)
    } else {
      return this.prizePoolContract.depositTo(usersAddress, amountUnformatted)
    }
  }

  /**
   * Submits a transaction to deposit a controlled token into the Prize Pool to the Signer.
   * @param amountUnformatted  an unformatted and decimal shifted amount to deposit from the prize pool
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async depositAndDelegate(
    amountUnformatted: BigNumber,
    to?: string,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'User [depositToAndDelegate]'
    await this.validateSignerNetwork(errorPrefix)
    if (to) {
      await validateAddress(errorPrefix, to)
    }

    const usersAddress = await this.signer.getAddress()
    if (Boolean(overrides)) {
      return this.prizePoolContract.depositToAndDelegate(
        usersAddress,
        amountUnformatted,
        to || usersAddress,
        overrides
      )
    } else {
      return this.prizePoolContract.depositToAndDelegate(
        usersAddress,
        amountUnformatted,
        to || usersAddress
      )
    }
  }

  /**
   * Submits a transaction to set an allowance for deposits into the Prize Pool.
   * @param amountUnformatted  an unformatted and decimal shifted amount to approve for deposits
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async approveDeposits(
    amountUnformatted?: BigNumber,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'User [approveDeposits]'
    await this.validateSignerNetwork(errorPrefix)

    const prizePoolAddress = this.prizePoolMetadata.address
    const tokenContract = await this.getTokenContract()
    if (Boolean(overrides)) {
      return tokenContract.approve(prizePoolAddress, amountUnformatted || MaxUint256, overrides)
    } else {
      return tokenContract.approve(prizePoolAddress, amountUnformatted || MaxUint256)
    }
  }

  /**
   * Submits a transaction to set an allowance for deposits to 0 for the Prize Pool.
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async revokeDeposits(overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'User [revokeDeposits]'
    await this.validateSignerNetwork(errorPrefix)

    const prizePoolAddress = this.prizePoolMetadata.address
    const tokenContract = await this.getTokenContract()
    if (Boolean(overrides)) {
      return tokenContract.approve(prizePoolAddress, 0 || MaxUint256, overrides)
    } else {
      return tokenContract.approve(prizePoolAddress, 0 || MaxUint256)
    }
  }

  /**
   * Submits a transaction to delegate to ticket chance to the users self
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async selfDelegateTickets(overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'User [selfDelegateTickets]'
    await this.validateSignerNetwork(errorPrefix)

    const usersAddress = await this.signer.getAddress()
    if (Boolean(overrides)) {
      return this.delegateTickets(usersAddress, overrides)
    } else {
      return this.delegateTickets(usersAddress)
    }
  }

  /**
   * Delegates the users ticket chance to the provided address
   * @param address the address to delegate to
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async delegateTickets(address: string, overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'User [delegateTickets]'
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
   * Fetches the Users ticket balance.
   * @returns the users ticket balance
   */
  async getTicketBalance(): Promise<BigNumber> {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersTicketBalance(usersAddress)
  }

  /**
   * Fetches the Users token (underlying token) balance.
   * @returns the users underlying token balance
   */
  async getTokenBalance(): Promise<BigNumber> {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersTokenBalance(usersAddress)
  }

  /**
   * Fetches the allowance the User has for depositing into the Prize Pool.
   * @returns the allowance the user has set for deposits
   */
  async getDepositAllowance() {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersDepositAllowance(usersAddress)
  }

  /**
   * Fetches the address the user has delegated to
   * @returns the address the user has delegated to
   */
  async getTicketDelegate() {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersTicketDelegate(usersAddress)
  }

  //////////////////////////// Validation methods ////////////////////////////

  /**
   * Validates the provided signers network.
   * Throws if it does not match the expected network.
   * @param errorPrefix the class and function name of where the error occurred
   */
  async validateSignerNetwork(errorPrefix: string) {
    validateSignerNetwork(errorPrefix, this.signer, this.chainId)
  }
}
