import { Signer } from '@ethersproject/abstract-signer'
import { Contract } from '@ethersproject/contracts'
import { Provider } from '@ethersproject/providers'
import { ContractIdentifier, ContractList } from '@pooltogether/contract-list-schema'

import { SignersOrProviders } from './types'
import { createContract, createInterface } from './utils'
import { debug } from './utils/debug'
import { findInContractList } from './utils/findInContractList'

/**
 * An ethers Contract Factory.
 * Given a ContractList, the ContractFactory will initialize ethers Contracts and easily provide Providers or Signers.
 */
export class ContractFactory {
  readonly signersOrProviders: SignersOrProviders
  readonly contractList: ContractList

  /**
   * Create an instance of a ContractFactory by providing Signers or Providers keyed by their chain ids and a list of contract metadata.
   * @constructor
   * @param signersOrProviders signers or providers keyed by their chain ids
   * @param contractList a list of contract metadata
   */
  constructor(signersOrProviders: SignersOrProviders, contractList: ContractList) {
    if (!signersOrProviders) throw new Error('signersOrProviders is required')
    if (!contractList) throw new Error('contractList is required')

    this.signersOrProviders = signersOrProviders
    this.contractList = contractList
    return this
  }

  /**
   * Creates an ethers Contract for the contract identifier provided using the ContractList and Signers or Providers provided on initialization.
   * @param chainId the chain id the contract was deployed on
   * @param address the address of the contract to create
   * @returns an ethers contract for the provided contract identifier
   */
  getContract(chainId: number, address: string): Contract {
    const contract = findInContractList(this.contractList.contracts, chainId, address)
    debug('PoolTogetherV4:getContract', contract)
    if (!contract) {
      throw new Error(`Contract not found for chainId: ${chainId} and address: ${address}`)
    }
    return createContract(
      contract.address,
      createInterface(contract.abi),
      this.getSignerOrProvider(contract.chainId)
    )
  }

  /**
   * Creates multiple ethers Contracts for the identifiers provided using the ContractList and Signers or Providers provided on initialization.
   * @param contractIdentifiers a list of unique identifiers for contracts to create
   * @returns a list of ethers contracts for the provided conract identifiers
   */
  getContracts(contractIdentifiers: ContractIdentifier[]): Contract[] {
    return contractIdentifiers.map(
      (contractIdentifier: ContractIdentifier): Contract => {
        return this.getContract(contractIdentifier.chainId, contractIdentifier.address)
      }
    )
  }

  /**
   * Gets a Signer or Provider for the chain id requested from the Signers or Providers prodiced on initialization.
   * @param chainId the chain id to get a signer or provider for
   * @returns the signer or provider for the chain id requested
   */
  getSignerOrProvider(chainId: number): Signer | Provider {
    return this.signersOrProviders[chainId]
  }

  /**
   * Getter for the Signers or Providers provided on initialization.
   * @returns the signers or providers the contract factory was initialized with
   */
  getSignersOrProviders() {
    return this.signersOrProviders
  }

  /**
   * Getter for the ContractList provided on initialization.
   * @returns the contract list the contract factory was initialized with
   */
  getContractList() {
    return this.contractList
  }
}
