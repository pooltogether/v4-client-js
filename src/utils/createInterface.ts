import { Interface } from '@ethersproject/abi'

export function createInterface(abi: any) {
  return new Interface(abi)
}
