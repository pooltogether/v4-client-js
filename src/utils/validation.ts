import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'
import { isAddress } from '@ethersproject/address'

/**
 * Throws an error if the provided address is invalid.
 * @param errorPrefix the class and function name of where the error occurred
 * @param address the address to validate
 */
export function validateAddress(errorPrefix: string, address: string) {
  const isValidAddress = isAddress(address)
  if (!isValidAddress) {
    throw new Error(errorPrefix + ` | Invalid address: '${address}'`)
  }
}

/**
 * Throws an error if the Signer provided is not on the chain id provided.
 * @param errorPrefix the class and function name of where the error occurred
 * @param signer a Signer to validate
 * @param chainId the network to check for
 */
export async function validateSignerNetwork(errorPrefix: string, signer: Signer, chainId: number) {
  const signerChainId = await signer.getChainId()
  if (signerChainId !== chainId) {
    throw new Error(
      errorPrefix + ` | Signer is on network ${signerChainId}. Expected network ${chainId}`
    )
  }
}

/**
 * Throws an error if the signerOrProvider is not a Signer
 * @param errorPrefix the class and function name of where the error occurred
 * @param signerOrProvider a Signer or Provider to check
 */
export function validateIsSigner(errorPrefix: string, signerOrProvider: Provider | Signer) {
  if (!Signer.isSigner(signerOrProvider)) {
    throw new Error(errorPrefix + ' | signerOrProvider is not a signer')
  }
}

/**
 * Throws and error if the Signer or Provider is not on the chain id provided.
 * @param errorPrefix the class and function name of where the error occurred
 * @param signerOrProvider a Signer or Provider to check
 * @param chainId the network to check for
 */
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
    throw new Error(errorPrefix + ` | Invalid value for signerOrProvider`)
  } else if (signerOrProviderChainId !== chainId) {
    throw new Error(
      errorPrefix +
        ` | Provider is on network ${signerOrProviderChainId}. Expected network ${chainId}`
    )
  }
}
