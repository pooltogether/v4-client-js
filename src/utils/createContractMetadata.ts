import { Contract as ContractMetadata } from '@pooltogether/contract-list-schema'

import { ContractType } from '../constants'
import { Version } from '../types'

export function createContractMetadata(
  chainId: number,
  address: string,
  type: ContractType,
  abi: any[],
  version: Version = {
    major: 1,
    minor: 0,
    patch: 0
  },
  tags: string[] = [],
  extensions: {
    readonly [key: string]: any
  } = {}
) {
  return {
    chainId,
    address,
    version,
    type,
    abi,
    tags,
    extensions
  } as ContractMetadata
}
