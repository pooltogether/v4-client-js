import { Provider } from '@ethersproject/abstract-provider'
import { Contract } from '@ethersproject/contracts'
import { Contract as ContractMetadata } from '@pooltogether/contract-list-schema'
import { PrizePoolTokenBalances, TokenData } from './types'
import { ContractType } from './constants'
import { Signer } from '@ethersproject/abstract-signer'
import { BigNumber } from '@ethersproject/BigNumber'
import { getTokenData, getUsersERC20Balance } from './utils/contractGetters'
import { validateAddress, validateSignerOrProviderNetwork } from './utils/validation'

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
  readonly prizePool: ContractMetadata
  readonly ticket: ContractMetadata
  readonly token: ContractMetadata
  // TODO: see below
  // readonly claimableDraws: ContractMetadata[]

  // Ethers contracts
  readonly prizePoolContract: Contract
  readonly ticketContract: Contract
  readonly tokenContract: Contract
  // TODO: see below
  // readonly claimableDrawContracts: Contract[]

  // TODO: Validate provider network? Can we even do this? It's an async method on the provider.
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
    // TODO: Migrated to its own class for the time being since we aren't labelling
    // the relationships inside the linked prize pool contract list
    // const [claimableDrawContractMetadatas, claimableDrawContracts] = getMetadataAndContracts(
    //   signerOrProvider,
    //   ContractType.ClaimableDraw,
    //   contractMetadataList
    // )

    this.contractMetadataList = contractMetadataList
    this.signerOrProvider = signerOrProvider
    this.chainId = prizePoolContractMetadata.chainId
    this.address = prizePoolContractMetadata.address

    // Set metadata
    this.prizePool = prizePoolContractMetadata
    this.ticket = ticketContractMetadata
    this.token = tokenContractMetadata
    // TODO: see above.
    // this.claimableDraws = claimableDrawContractMetadatas

    // Set ethers contracts
    this.prizePoolContract = prizePoolContract
    this.ticketContract = ticketContract
    this.tokenContract = tokenContract
    // TODO: see above
    // this.claimableDrawContracts = claimableDrawContracts
  }

  //////////////////////////// Ethers read functions ////////////////////////////

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

  async getUsersTicketBalance(usersAddress: string) {
    const errorPrefix = 'PrizePool [getUsersTicketBalance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    return getUsersERC20Balance(usersAddress, this.ticketContract)
  }

  async getUsersTokenBalance(usersAddress: string) {
    const errorPrefix = 'PrizePool [getUsersTokenBalance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    return getUsersERC20Balance(usersAddress, this.tokenContract)
  }

  async getUsersDepositAllowance(usersAddress: string) {
    const errorPrefix = 'PrizePool [getUsersDepositAllowance] | '
    await validateAddress(errorPrefix, usersAddress)
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    const prizePoolAddress = this.prizePool.address
    const result = await this.tokenContract.functions.allowance(usersAddress, prizePoolAddress)
    const allowanceUnformatted: BigNumber = result[0]
    return { allowanceUnformatted, isApproved: !allowanceUnformatted.isZero() }
  }

  async getTokenData(): Promise<TokenData> {
    const errorPrefix = 'PrizePool [getTokenData] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    return getTokenData(this.tokenContract)
  }

  async getTicketData(): Promise<TokenData> {
    const errorPrefix = 'PrizePool [getTicketData] | '
    await validateSignerOrProviderNetwork(errorPrefix, this.signerOrProvider, this.chainId)

    return getTokenData(this.tokenContract)
  }

  //////////////////////////// Methods ////////////////////////////

  id(): string {
    return `${this.prizePool.address}-${this.prizePool.chainId}`
  }
}

//////////////////////////// Helpers ////////////////////////////

function getMetadataAndContract(
  signerOrProvider: Provider | Signer,
  contractType: ContractType,
  contractMetadataList: ContractMetadata[]
): [ContractMetadata, Contract] {
  const contractMetadata = contractMetadataList.find((contract) => contract.type === contractType)
  if (!contractMetadata) {
    throw new Error(`Invalid Prize Pool contract list. Missing ${contractType}.`)
  }
  const contract = new Contract(contractMetadata.address, contractMetadata.abi, signerOrProvider)

  return [contractMetadata, contract]
}

// function getMetadataAndContracts(
//   signerOrProvider: Provider | Signer,
//   contractType: ContractType,
//   contractMetadataList: ContractMetadata[]
// ): [ContractMetadata[], Contract[]] {
//   const contractMetadatas = contractMetadataList.filter(
//     (contract) => contract.type === contractType
//   )
//   if (contractMetadatas.length === 0) {
//     throw new Error(`Invalid Prize Pool contract list. Missing at least 1 ${contractType}.`)
//   }
//   const contracts = contractMetadatas.map(
//     (contractMetadata) =>
//       new Contract(contractMetadata.address, contractMetadata.abi, signerOrProvider)
//   )

//   return [contractMetadatas, contracts]
// }
