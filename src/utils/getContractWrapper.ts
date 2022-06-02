import { ContractWrapper } from '../ContractWrapper'

export function getContractWrapper(
  contractWrappers: ContractWrapper[],
  chainId: number,
  address: string
) {
  return contractWrappers.find(
    (prizeDistributor) =>
      prizeDistributor.chainId === chainId && prizeDistributor.address === address
  )
}
