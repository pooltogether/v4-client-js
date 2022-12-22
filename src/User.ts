import { TransactionResponse } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/bignumber'
import { MaxUint256 } from '@ethersproject/constants'
import { Overrides } from '@ethersproject/contracts'
import { Contract as ContractMetadata } from '@pooltogether/contract-list-schema'
import { signERC2612Permit } from 'eth-permit'
import { RSV } from 'eth-permit/dist/rpc'

import { PrizePool } from './PrizePool'
import { ERC2612PermitMessage } from './types'
import { validateAddress, validateSignerNetwork } from './utils'
import { formatEIP2612SignatureTuple } from './utils/formatEIP2612SignatureTuple'

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
   * @param amountUnformatted an unformatted and decimal shifted amount to deposit from the prize pool
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
   * @param amountUnformatted an unformatted and decimal shifted amount to approve for deposits
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
      return tokenContract.approve(prizePoolAddress, 0, overrides)
    } else {
      return tokenContract.approve(prizePoolAddress, 0)
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

  /**
   * Requests a signature from the user to approve a deposit
   * @param amountUnformatted an unformatted and decimal shifted amount to approve for deposits
   * @returns a promise to request a signature
   */
  async getPermitAndDepositSignaturePromise(
    amountUnformatted: BigNumber
  ): Promise<(ERC2612PermitMessage & RSV) | undefined> {
    const errorPrefix = 'User [approveDepositsWithSignature]'
    await this.validateSignerNetwork(errorPrefix)

    const tokenContract = await this.getTokenContract()

    if (
      !this.eip2612PermitAndDepositMetadata ||
      !this.eip2612PermitAndDepositContract ||
      !this.tokenMetadata ||
      !this.signer.provider
    )
      throw new Error(errorPrefix + ` | Error intitializing contract metadata.`)

    const usersAddress = await this.signer.getAddress()

    const domain = {
      name: 'PoolTogether ControlledToken',
      version: '1',
      chainId: this.chainId,
      verifyingContract: this.tokenMetadata.address
    }

    // NOTE: Nonce must be passed manually for signERC2612Permit to work with WalletConnect
    const deadline = (await this.signer.provider.getBlock('latest')).timestamp + 5 * 60
    const response = await tokenContract.functions.nonces(usersAddress)
    const nonce: BigNumber = response[0]

    const signaturePromise = signERC2612Permit(
      this.signer,
      domain,
      usersAddress,
      this.eip2612PermitAndDepositMetadata.address,
      amountUnformatted.toString(),
      deadline,
      nonce.toNumber()
    )

    return signaturePromise
  }

  async getPermitAndDelegateSignaturePromise() {
    // TODO - need a second signature (_delegateSignature) in order to deposit AND delegate through EIP2612 contract
  }

  /**
   * Submits a transaction to deposit and delegate a token into the prize pool using signature approvals.
   * @param amountUnformatted an unformatted and decimal shifted amount to deposit into the prize pool
   * @param permitSignature an EIP2612 signature to approve the token deposit
   * @param delegateSignature an EIP2612 signature to approve the token delegation
   * @param to optional wallet address to delegate to (if empty, delegates to same user)
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async depositAndDelegateWithSignature(
    amountUnformatted: BigNumber,
    permitSignature: ERC2612PermitMessage & RSV,
    delegateSignature: ERC2612PermitMessage & RSV,
    to?: string,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'User [depositToAndDelegateWithSignature]'
    await this.validateSignerNetwork(errorPrefix)
    if (to) {
      await validateAddress(errorPrefix, to)
    }

    const usersAddress = await this.signer.getAddress()

    const formattedPermitSignature = formatEIP2612SignatureTuple(permitSignature)
    const formattedDelegateSignature = {
      address: to || usersAddress,
      signature: formatEIP2612SignatureTuple(delegateSignature)
    }

    if (Boolean(overrides)) {
      return this.prizePoolContract.permitAndDepositToAndDelegate(
        this.address,
        amountUnformatted,
        to || usersAddress,
        formattedPermitSignature,
        formattedDelegateSignature,
        overrides
      )
    } else {
      return this.prizePoolContract.permitAndDepositToAndDelegate(
        this.address,
        amountUnformatted,
        to || usersAddress,
        formattedPermitSignature,
        formattedDelegateSignature
      )
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
