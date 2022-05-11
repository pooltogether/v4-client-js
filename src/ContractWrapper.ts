import { Contract } from 'ethers'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { ContractType } from './constants'
import { getMetadataAndContract } from './utils/getMetadataAndContract'
import { Contract as ContractMetadata } from './types'
import { validateIsSigner, validateSignerNetwork } from './utils/validation'

export class ContractWrapper {
  readonly chainId: number
  readonly address: string
  readonly signerOrProvider: Provider | Signer
  readonly contractMetadataList: ContractMetadata[]

  constructor(
    metadata: ContractMetadata,
    signerOrProvider: Provider | Signer,
    contractMetadataList: ContractMetadata[]
  ) {
    // Set data
    this.signerOrProvider = signerOrProvider
    this.contractMetadataList = contractMetadataList
    this.chainId = metadata.chainId
    this.address = metadata.address
  }

  //////////////////////////// Methods ////////////////////////////

  /**
   * Returns a unique id string for this contract.
   * @returns a unique id string
   */
  id(): string {
    return `${this.address}-${this.chainId}`
  }

  //////////////////////////// Ethers Contracts Initializers ////////////////////////////

  /**
   * Fetches a contract address, finds the relevant metadata in the ContractList and creates an ethers Contract for that contract. The ethers Contract is cached on the instance of the PrizeDistributor and is returned immediately if already stored.
   * @param key the key for the requested contract to be stored on the PrizeDistributor
   * @param contractType the contract name
   * @param getContractAddress a function to fetch the contract address
   * @returns an ethers Contract for the provided address and contract type
   */
  protected async getAndSetEthersContract(
    key: string,
    contractType: ContractType,
    getContractAddress: () => Promise<string>
  ): Promise<Contract> {
    const contractKey = `${key}Contract`
    const metadataKey = `${key}Metadata`
    // @ts-ignore
    if (this[contractKey] !== undefined) return this[contractKey]

    const contractAddress = await getContractAddress()
    const { contractMetadata, contract } = getMetadataAndContract(
      this.chainId,
      this.signerOrProvider,
      contractType,
      this.contractMetadataList,
      contractAddress
    )
    // @ts-ignore
    this[metadataKey] = contractMetadata
    // @ts-ignore
    this[contractKey] = contract
    return contract
  }

  //////////////////////////// Validation methods ////////////////////////////

  /**
   * Validates that a Signer is on the network the contract is deployed on.
   * @param errorPrefix the class and function name of where the error occurred
   */
  async validateSignerNetwork(errorPrefix: string) {
    validateSignerNetwork(errorPrefix, this.signerOrProvider as Signer, this.chainId)
  }

  /**
   * Validates that the data provided for providerOrSigner is a Signer.
   * @param errorPrefix the class and function name of where the error occurred
   */
  async validateIsSigner(errorPrefix: string) {
    validateIsSigner(errorPrefix, this.signerOrProvider)
  }
}
