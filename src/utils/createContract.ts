import { Interface } from '@ethersproject/abi'
import { Contract } from '@ethersproject/contracts'
import { Provider } from '@ethersproject/abstract-provider'
import { Signer } from '@ethersproject/abstract-signer'

export const createContract = (
  address: string,
  contractInterface: Interface,
  provider: Provider | Signer
): Contract => {
  return new Contract(address, contractInterface, provider)
}
