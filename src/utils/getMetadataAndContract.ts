import { Provider } from '@ethersproject/abstract-provider'
import { Contract } from '@ethersproject/contracts'
import { Signer } from '@ethersproject/abstract-signer'
import { ContractType } from '../constants'
import { Contract as ContractMetadata } from '@pooltogether/contract-list-schema'

export function getMetadataAndContract(
  signerOrProvider: Provider | Signer,
  contractType: ContractType,
  contractMetadataList: ContractMetadata[],
  addressOverride?: string
): [ContractMetadata, Contract] {
  const contractMetadata = contractMetadataList.find((contract) => contract.type === contractType)
  if (!contractMetadata) {
    throw new Error(`Invalid contract list. Missing ${contractType}.`)
  }
  const contract = new Contract(
    addressOverride || contractMetadata.address,
    contractMetadata.abi,
    signerOrProvider
  )

  return [contractMetadata, contract]
}
