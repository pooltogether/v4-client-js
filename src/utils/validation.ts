import { isAddress } from '@ethersproject/address'
import { Signer } from '@ethersproject/abstract-signer'
import { Provider } from '@ethersproject/abstract-provider'

export function validateAddress(errorPrefix: string, address: string) {
  const isValidAddress = isAddress(address)
  if (!isValidAddress) {
    throw new Error(errorPrefix + `Invalid address: '${address}'`)
  }
}

export async function validateSignerNetwork(errorPrefix: string, signer: Signer, chainId: number) {
  const signerChainId = await signer.getChainId()
  if (signerChainId !== chainId) {
    throw new Error(
      errorPrefix + `Signer is on network ${signerChainId}. Expected network ${chainId}`
    )
  }
}

export async function validateSignerOrProviderNetwork(
  errorPrefix: string,
  signerOrProvider: Provider | Signer,
  chainId: number
) {
  let signerOrProviderChainId
  if (Provider.isProvider(signerOrProvider)) {
    const { chainId: providerChainId } = await signerOrProvider.getNetwork()
    signerOrProviderChainId = providerChainId
  } else if (Signer.isSigner(signerOrProvider)) {
    signerOrProviderChainId = await signerOrProvider.getChainId()
  }

  if (!signerOrProviderChainId) {
    throw new Error(errorPrefix + `Invalid value for signerOrProvider`)
  } else if (signerOrProviderChainId !== chainId) {
    throw new Error(
      errorPrefix + `Provider is on network ${signerOrProviderChainId}. Expected network ${chainId}`
    )
  }
}
