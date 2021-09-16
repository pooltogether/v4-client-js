import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/abstract-provider'
import { ethers } from 'ethers'
import { PrizePool } from './PrizePool'
import { validateAddress, validateSignerNetwork } from './utils/validation'

/**
 * A Player for a Prize Pool.
 * Provides read & write functionality for a Prize Pool.
 * Reads use the provider from the PrizePool.
 * Writes use the signer from the contructor.
 * Throws an error if a write is trigger with a signer on an
 * incorrect network.
 */
export class Player extends PrizePool {
  readonly signer: Signer

  constructor(signer: Signer, prizePool: PrizePool) {
    super(signer, prizePool.contractMetadataList)

    this.signer = signer
  }

  //////////////////////////// Wrapped ethers write functions ////////////////////////////

  async withdrawTicket(
    amountUnformatted: BigNumber,
    maximumExitFeeUnformatted?: BigNumber
  ): Promise<TransactionResponse> {
    const ticketAddress = this.ticket.address
    return this.withdrawInstantlyFrom(amountUnformatted, ticketAddress, maximumExitFeeUnformatted)
  }

  async depositTicket(amountUnformatted: BigNumber): Promise<TransactionResponse> {
    const ticketAddress = this.ticket.address
    return this.depositTo(amountUnformatted, ticketAddress)
  }

  //////////////////////////// Ethers write functions ////////////////////////////

  async withdrawInstantlyFrom(
    amountUnformatted: BigNumber,
    controlledTokenAddress: string,
    maximumExitFeeUnformatted: BigNumber = ethers.constants.Zero
  ): Promise<TransactionResponse> {
    const errorPrefix = 'Player [withdrawInstantlyFrom] | '
    await this.validateSignerNetwork(errorPrefix)
    await validateAddress(errorPrefix, controlledTokenAddress)

    const usersAddress = await this.signer.getAddress()
    return this.prizePoolContract.withdrawInstantlyFrom(
      usersAddress,
      amountUnformatted,
      controlledTokenAddress,
      maximumExitFeeUnformatted
    )
  }

  async depositTo(
    amountUnformatted: BigNumber,
    controlledTokenAddress: string
  ): Promise<TransactionResponse> {
    const errorPrefix = 'Player [depositTo] | '
    await this.validateSignerNetwork(errorPrefix)
    await validateAddress(errorPrefix, controlledTokenAddress)

    const usersAddress = await this.signer.getAddress()
    return this.prizePoolContract.depositTo(usersAddress, amountUnformatted, controlledTokenAddress)
  }

  async approveDeposits(): Promise<TransactionResponse> {
    const prizePoolAddress = this.prizePool.address
    return this.tokenContract.approve(prizePoolAddress, ethers.constants.MaxUint256)
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  async getTicketBalance(): Promise<BigNumber> {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersTicketBalance(usersAddress)
  }

  async getTokenBalance(): Promise<BigNumber> {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersTokenBalance(usersAddress)
  }

  async getDepositAllowance() {
    const usersAddress = await this.signer.getAddress()
    return this.getUsersDepositAllowance(usersAddress)
  }

  //////////////////////////// Utility methods ////////////////////////////

  async validateSignerNetwork(errorPrefix: string) {
    return validateSignerNetwork(errorPrefix, this.signer, this.chainId)
  }
}
