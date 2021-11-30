import { ContractIdentifier, ContractList } from '@pooltogether/contract-list-schema'
import { Contract } from '@ethersproject/contracts'

import { createContract, createInterface } from './utils'
import { SignersOrProviders } from './types'
import { debug } from './utils/debug'
import { findInContractList } from './utils/findInContractList'
import { Signer } from '@ethersproject/abstract-signer'
import { Provider } from '@ethersproject/providers'

export class ContractFactory {
  readonly signersOrProviders: SignersOrProviders
  readonly contractList: ContractList

  constructor(signersOrProviders: SignersOrProviders, contractList: ContractList) {
    if (!signersOrProviders) throw new Error('signersOrProviders is required')
    if (!contractList) throw new Error('contractList is required')

    this.signersOrProviders = signersOrProviders
    this.contractList = contractList
    return this
  }

  getContract(chainId: number, address: string): Contract {
    const contract = findInContractList(this.contractList, chainId, address)
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

  getContracts(contractIdentifiers: ContractIdentifier[]): Contract[] {
    return contractIdentifiers.map(
      (contractIdentifier: ContractIdentifier): Contract => {
        return this.getContract(contractIdentifier.chainId, contractIdentifier.address)
      }
    )
  }

  getSignerOrProvider(chainId: number): Signer | Provider {
    return this.signersOrProviders[chainId]
  }

  getSignersOrProviders() {
    return this.signersOrProviders
  }

  getContractList() {
    return this.contractList
  }
}
