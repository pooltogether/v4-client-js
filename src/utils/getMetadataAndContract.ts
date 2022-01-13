import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { Contract } from '@ethersproject/contracts'
import { Contract as ContractMetadata } from '@pooltogether/contract-list-schema'

import { ContractType } from '../constants'
import { createContract } from '../utils/createContract'
import { createInterface } from '../utils/createInterface'

export function getMetadataAndContract(
  chainId: number,
  signerOrProvider: Provider | Signer,
  contractType: ContractType,
  contractMetadataList: ContractMetadata[],
  addressOverride?: string
): { contractMetadata: ContractMetadata; contract: Contract } {
  const contractMetadata = contractMetadataList.find(
    (contract) => contract.type === contractType && contract.chainId === chainId
  )
  if (!contractMetadata) {
    throw new Error(`Invalid contract list. Missing ${contractType}.`)
  }
  const contract = createContract(
    addressOverride || contractMetadata.address,
    createInterface(contractMetadata.abi),
    signerOrProvider
  )

  return { contractMetadata, contract }
}
