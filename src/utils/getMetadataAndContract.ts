import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { Contract } from '@ethersproject/contracts'
import { Contract as ContractMetadata } from '@pooltogether/contract-list-schema'

import { ContractType } from '../constants'
import { createContract } from '../utils/createContract'
import { createInterface } from '../utils/createInterface'

/**
 * Finds a specific contract in the contract list and returns the metadata and ethers Contract.
 * If an addressOverride is supplied, it will be used to look up the contract in the metadata list. If it is not found, the first contract found in the list of that type regardless of version will be used.
 * @param chainId
 * @param signerOrProvider
 * @param contractType
 * @param contractMetadataList
 * @param addressOverride
 * @returns
 */
export function getMetadataAndContract(
  chainId: number,
  signerOrProvider: Provider | Signer,
  contractType: ContractType,
  contractMetadataList: ContractMetadata[],
  addressOverride?: string
): { contractMetadata: ContractMetadata; contract: Contract } {
  let contractMetadata
  if (!!addressOverride) {
    contractMetadata = contractMetadataList.find(
      (contract) =>
        contract.type === contractType &&
        contract.chainId === chainId &&
        contract.address === addressOverride
    )
  }

  // Fallback for no addressOverride provided or found
  if (!contractMetadata) {
    contractMetadata = contractMetadataList.find(
      (contract) => contract.type === contractType && contract.chainId === chainId
    )
  }

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
