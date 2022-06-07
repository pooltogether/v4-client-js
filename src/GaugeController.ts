import { MaxUint256 } from '@ethersproject/constants'
import { Result } from '@ethersproject/abi'
import { Provider, TransactionResponse } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { Contract } from '@ethersproject/contracts'
import { Contract as ContractMetadata } from '@pooltogether/contract-list-schema'
import { BigNumber, Overrides } from 'ethers'

import { ContractWrapper } from './ContractWrapper'
import { validateAddress, validateSignerOrProviderNetwork } from './utils/validation'
import ERC20Abi from './abis/ERC20Abi'
import { ContractType } from './constants'
import { createContractMetadata } from './utils/createContractMetadata'
import { TokenData } from './types'
import { getTokenData } from './utils/contractGetters'

/**
 * A Gauge Controller.
 * Provides read only functions for the contracts that make up the deployment of this Gauge Controller.
 */
export class GaugeController extends ContractWrapper {
  // Contract metadata
  readonly gaugeControllerMetadata: ContractMetadata
  tokenMetadata: ContractMetadata | undefined
  gaugeRewardMetadata: ContractMetadata | undefined

  // Ethers contracts
  readonly gaugeControllerContract: Contract
  tokenContract: Contract | undefined
  gaugeRewardContract: Contract | undefined

  constructor(
    metadata: ContractMetadata,
    signerOrProvider: Provider | Signer,
    contractMetadataList: ContractMetadata[]
  ) {
    super(metadata, signerOrProvider, contractMetadataList)

    this.gaugeControllerMetadata = metadata
    this.gaugeControllerContract = new Contract(metadata.address, metadata.abi, signerOrProvider)
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  /**
   * Fetches decimals, name and symbol for the gauge Token.
   * @returns decimals, name and symbol for the gauge token
   */
  async getGaugeTokenData(): Promise<TokenData> {
    const errorPrefix = 'GaugeController [getGaugeTokenData] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const tokenContract = await this.getTokenContract()

    return getTokenData(tokenContract)
  }

  /**
   *
   * @param userAddress
   * @returns
   */
  async getGaugeControllerBalance(userAddress: string): Promise<BigNumber> {
    const errorPrefix = 'GaugeController [getGaugeControllerBalance] | '
    await validateAddress(errorPrefix, userAddress)

    const result: Result = await this.gaugeControllerContract.functions.balances(userAddress)
    return result[0]
  }

  /**
   *
   * @param userAddress
   * @param gauge the ticket address to identify the gauge
   * @returns
   */
  async getUserGaugeBalance(userAddress: string, gauge: string): Promise<BigNumber> {
    const errorPrefix = 'GaugeController [getGaugeBalance] | '
    await validateAddress(errorPrefix, userAddress)
    await validateAddress(errorPrefix, gauge)

    const result: Result = await this.gaugeControllerContract.functions.userGaugeBalance(
      userAddress,
      gauge
    )
    return result[0]
  }

  /**
   *
   * @param userAddress
   * @returns
   */
  async getUserGaugeTokenBalance(userAddress: string): Promise<BigNumber> {
    const errorPrefix = 'GaugeController [getUserGaugeTokenBalance] | '
    await validateAddress(errorPrefix, userAddress)
    const tokenContract = await this.getTokenContract()

    const result: Result = await tokenContract.functions.balanceOf(userAddress)
    return result[0]
  }

  /**
   *
   * @param gauge the ticket address to identify the gauge
   * @returns
   */
  async getGaugeRewardToken(gauge: string): Promise<TokenData> {
    const errorPrefix = 'GaugeController [getGaugeRewardsToken] | '
    await validateAddress(errorPrefix, gauge)
    const gaugeRewardContract = await this.getGaugeRewardContract()

    let result: Result = await gaugeRewardContract.functions.currentRewardToken(gauge)
    const tokenAddress = result[0]

    const tokenContract = new Contract(tokenAddress, ERC20Abi, this.signerOrProvider)
    return getTokenData(tokenContract)
  }

  /**
   *
   * @param userAddress
   * @param gauge the ticket address to identify the gauge
   * @returns
   */
  async getUserRedeemableGaugeRewardBalance(
    userAddress: string,
    gauge: string
  ): Promise<BigNumber> {
    const errorPrefix = 'GaugeController [getUserGaugeRewardBalance] | '
    await validateAddress(errorPrefix, userAddress)
    await validateAddress(errorPrefix, gauge)
    const gaugeRewardContract = await this.getGaugeRewardContract()

    const result: Result = await gaugeRewardContract.functions.userRewardTokenBalances(
      gauge,
      userAddress
    )
    return result[0]
  }

  /**
   *
   * @param userAddress
   * @param gauge the ticket address to identify the gauge
   * @returns
   */
  async getUserClaimableGaugeRewardBalance(
    userAddress: string,
    gauge: string,
    rewardTokenAddress: string
  ): Promise<BigNumber> {
    const errorPrefix = 'GaugeController [getUserGaugeRewardBalance] | '
    await validateAddress(errorPrefix, userAddress)
    await validateAddress(errorPrefix, gauge)
    await validateAddress(errorPrefix, rewardTokenAddress)
    const gaugeRewardContract = await this.getGaugeRewardContract()

    const result: Result = await gaugeRewardContract.functions.claim(
      gauge,
      rewardTokenAddress,
      userAddress
    )
    return result[0]
  }

  /**
   * Fetches the allowance the User has for depositing into the Prize Pool.
   * @returns the allowance the user has set for depositing
   */
  async getDepositAllowance() {
    const userAddress = await this.getUserAddress()
    return this.getUserDepositAllowance(userAddress)
  }

  /**
   * Fetches a user deposit allowance for the Gauge Controller.
   * @param userAddress the address to fetch the deposit allowance for
   * @returns the amount the user has approved for depositing
   */
  async getUserDepositAllowance(userAddress: string) {
    const errorPrefix = 'GaugeController [getUserDepositAllowance] | '
    await validateAddress(errorPrefix, userAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)
    const tokenContract = await this.getTokenContract()

    const gaugeControllerAddress = this.gaugeControllerMetadata.address
    const result = await tokenContract.functions.allowance(userAddress, gaugeControllerAddress)
    const allowanceUnformatted: BigNumber = result[0]
    return { allowanceUnformatted, isApproved: !allowanceUnformatted.isZero() }
  }

  //////////////////////////// Ethers write functions ////////////////////////////

  /**
   * Submits a transaction to set an allowance for depositing POOL into the gauge.
   * @param amountUnformatted  an unformatted and decimal shifted amount to approve for deposits
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async approveDepositing(
    amountUnformatted?: BigNumber,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'User [approveDeposits]'
    await this.validateSignerNetwork(errorPrefix)

    const gaugeControllerAddress = this.gaugeControllerMetadata.address
    const tokenContract = await this.getTokenContract()
    if (Boolean(overrides)) {
      return tokenContract.approve(
        gaugeControllerAddress,
        amountUnformatted || MaxUint256,
        overrides
      )
    } else {
      return tokenContract.approve(gaugeControllerAddress, amountUnformatted || MaxUint256)
    }
  }

  /**
   * Submits a transaction to deposit the gauge token into the GaugeController to the Signer.
   * @param amountUnformatted an unformatted and decimal shifted amount to deposit
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async deposit(amountUnformatted: BigNumber, overrides?: Overrides): Promise<TransactionResponse> {
    const errorPrefix = 'GaugeController [deposit]'
    await this.validateSignerNetwork(errorPrefix)
    const userAddress = await this.getUserAddress(errorPrefix)

    if (Boolean(overrides)) {
      return this.gaugeControllerContract.deposit(userAddress, amountUnformatted, overrides)
    } else {
      return this.gaugeControllerContract.deposit(userAddress, amountUnformatted)
    }
  }

  /**
   * Submits a transaction to withdraw from the GaugeController to the Signer.
   * @param amountUnformatted an unformatted and decimal shifted amount to withdraw
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async withdraw(
    amountUnformatted: BigNumber,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'GaugeController [withdraw]'
    await this.validateSignerNetwork(errorPrefix)
    await this.validateIsSigner(errorPrefix)

    if (Boolean(overrides)) {
      return this.gaugeControllerContract.withdraw(amountUnformatted, overrides)
    } else {
      return this.gaugeControllerContract.withdraw(amountUnformatted)
    }
  }

  /**
   * Submits a transaction to increase the gauge amount on the GaugeController to the Signer.
   * @param gauge the ticket address to identify the gauge to deposit on
   * @param amountUnformatted an unformatted and decimal shifted amount to add to a gauge
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async increaseGauge(
    gauge: string,
    amountUnformatted: BigNumber,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'GaugeController [increaseGauge]'
    await this.validateSignerNetwork(errorPrefix)
    await this.validateIsSigner(errorPrefix)

    if (Boolean(overrides)) {
      return this.gaugeControllerContract.increaseGauge(gauge, amountUnformatted, overrides)
    } else {
      return this.gaugeControllerContract.increaseGauge(gauge, amountUnformatted)
    }
  }

  /**
   * Submits a transaction to decrease the gauge amount on the GaugeController to the Signer.
   * @param gauge the ticket address to identify the gauge
   * @param amountUnformatted an unformatted and decimal shifted amount to remove from a gauge
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async decreaseGauge(
    gauge: string,
    amountUnformatted: BigNumber,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'GaugeController [decreaseGauge]'
    await this.validateSignerNetwork(errorPrefix)
    await this.validateIsSigner(errorPrefix)

    if (Boolean(overrides)) {
      return this.gaugeControllerContract.decreaseGauge(gauge, amountUnformatted, overrides)
    } else {
      return this.gaugeControllerContract.decreaseGauge(gauge, amountUnformatted)
    }
  }

  /**
   * Submits a transaction to redeem rewards for a user.
   * Redeeming rewards transfers tokens from the vault to the user.
   * @param rewardTokenAddress
   * @param userAddress
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async redeemUserRewards(
    rewardTokenAddress: string,
    userAddress: string,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'GaugeController [claimRewards]'
    await this.validateSignerNetwork(errorPrefix)
    await this.validateIsSigner(errorPrefix)
    const gaugeRewardContract = await this.getGaugeRewardContract()

    if (Boolean(overrides)) {
      return gaugeRewardContract.redeem(userAddress, rewardTokenAddress, overrides)
    } else {
      return gaugeRewardContract.redeem(userAddress, rewardTokenAddress)
    }
  }

  /**
   * Submits a transaction to claim rewards for a user.
   * Claiming rewards updates the amount of tokens that the user will be able to redeem.
   * @param gauge the ticket address to identify the gauge
   * @param rewardTokenAddress
   * @param userAddress
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async claimUserRewards(
    gauge: string,
    rewardTokenAddress: string,
    userAddress: string,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const errorPrefix = 'GaugeController [claimRewards]'
    await this.validateSignerNetwork(errorPrefix)
    await this.validateIsSigner(errorPrefix)
    const gaugeRewardContract = await this.getGaugeRewardContract()

    if (Boolean(overrides)) {
      return gaugeRewardContract.claim(gauge, rewardTokenAddress, userAddress, overrides)
    } else {
      return gaugeRewardContract.claim(gauge, rewardTokenAddress, userAddress)
    }
  }

  /**
   * Submits a transaction to claim rewards for a user using the current on chain rewards token.
   * Claiming rewards updates the amount of tokens that the user will be able to redeem.
   * @param gauge the ticket address to identify the gauge
   * @param userAddress
   * @param overrides optional overrides for the transaction creation
   * @returns the transaction response
   */
  async claimCurrentUserRewards(
    gauge: string,
    userAddress: string,
    overrides?: Overrides
  ): Promise<TransactionResponse> {
    const token = await this.getGaugeRewardToken(gauge)
    return this.claimUserRewards(gauge, token.address, userAddress, overrides)
  }

  //////////////////////////// Methods ////////////////////////////

  /**
   * Returns the user address of the provided Signer.
   * GaugeController can be initialized with a Signer.
   * @param errorPrefix the class and function name of where the error occurred
   * @returns the address of the user
   */
  async getUserAddress(errorPrefix = 'GaugeController [getUserAddress] |') {
    await this.validateIsSigner(errorPrefix)
    return await (this.signerOrProvider as Signer).getAddress()
  }

  //////////////////////////// Ethers Contracts Initializers ////////////////////////////

  /**
   * Fetches the address of the Token that is used by this GaugeController and caches the ethers Contract for the ERC20 Token.
   * @returns an ethers Contract for the ERC20 Token related to this GaugeController
   */
  async getTokenContract(): Promise<Contract> {
    if (this.tokenContract !== undefined) return this.tokenContract
    const getAddress = async () => {
      const result: Result = await this.gaugeControllerContract.functions.token()
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
   * Fetches the address of the GaugeReward used by this GaugeController and caches the ethers Contract.
   * @returns an ethers Contract for the GaugeReward contract related to this GaugeController
   */
  async getGaugeRewardContract(): Promise<Contract> {
    const getAddress = async () => {
      const result: Result = await this.gaugeControllerContract.functions.gaugeReward()
      return result[0]
    }
    return this.getAndSetEthersContract('gaugeReward', ContractType.GaugeReward, getAddress)
  }

  /**
   * Fetches the address of the Liquidator used by this GaugeController and caches the ethers Contract.
   * @returns an ethers Contract for the Liquidator contract related to this GaugeController
   */
  async getLiquidatorContract(): Promise<Contract> {
    const getAddress = async () => {
      const gaugeRewardContract = await this.getGaugeRewardContract()
      const result: Result = await gaugeRewardContract.functions.liquidator()
      return result[0]
    }
    return this.getAndSetEthersContract('liquidator', ContractType.Liquidator, getAddress)
  }
}
