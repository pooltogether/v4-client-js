import { ContractList } from '@pooltogether/contract-list-schema'

import { initializePrizeDistributors, PrizeDistributor } from './PrizeDistributor'
import { initializePrizePools, PrizePool } from './PrizePool'
import { Providers } from './types'

/**
 * A Prize Pool Network.
 * The network consists of one or more Prize Pools and Prize Distributors. PrizePoolNetwork provides read only functions for reading data from the contracts that make up the network. Initializes several PrizePools and PrizeDistributors on creation.
 */
export class PrizePoolNetwork {
  // Contract list describing the Prize Pool Network
  readonly contractList: ContractList
  // 1 read Provider per chain
  readonly providers: Providers
  // N Prize Pools
  readonly prizePools: PrizePool[]
  // 1 Prize Distributor per chain
  readonly prizeDistributors: PrizeDistributor[]

  /**
   * Create an instance of a PrizePoolNetwork by providing ethers Providers for each relevant network and a Contract List.
   * @constructor
   * @param providers ethers Providers for each network in the Prize Pool Network, keyed by their chain id.
   * @param contractList a Contract List containing all of the relevant metadata for the Prize Pool Network.
   */
  constructor(providers: Providers, contractList: ContractList) {
    this.providers = providers
    this.contractList = contractList
    this.prizePools = initializePrizePools(contractList, providers)
    this.prizeDistributors = initializePrizeDistributors(contractList, providers)
  }

  /**
   * Returns a unique id string for this PrizePoolNetwork.
   * @returns a unique id for the PrizePoolNetwork
   */
  id(): string {
    return `prize-pool-network-${this.prizePools
      .map((p) => p.id())
      .join('-')}-${this.prizeDistributors.map((p) => p.id()).join('-')}`
  }

  //////////////////////////// Ethers read functions ////////////////////////////

  /**
   * Fetch the users balances for all relevant tokens for all Prize Pools in the Prize Pool Network.
   * @param usersAddress address to get balances for.
   * @returns an array of objects containing the chain id & Prize Pool address and a balances object with the users balances for relevant tokens to the prize pool
   */
  async getUsersPrizePoolBalances(usersAddress: string) {
    const balancesPromises = this.prizePools.map(async (prizePool) => {
      const balances = await prizePool.getUsersPrizePoolBalances(usersAddress)
      return {
        chainId: prizePool.chainId,
        address: prizePool.address,
        balances
      }
    })
    return Promise.all(balancesPromises)
  }

  /**
   * Returns a PrizePool from the list of Prize Pools that was created on initialization by their primary key. The primary key of a Prize Pool is the chain id it is on and the address of the YieldSourcePrizePool contract.
   * @param chainId the chain id the requested prize pool is on
   * @param address the address of the YieldSourcePrizePool contract
   * @returns
   */
  getPrizePool(chainId: number, address: string): PrizePool | undefined {
    return this.prizePools.find(
      (prizePool) => prizePool.chainId === chainId && prizePool.address === address
    )
  }

  /**
   * Returns a PrizeDistributor from the list of Prize Distributors that was created on initialization by their primary key. The primary key of a Prize Disctributor is the chain id it is on and the address of the PrizeDistributor contract.
   * @param chainId the chain id the requested prize distributor is on
   * @param address the address of the PrizeDistributor contract
   * @returns
   */
  getPrizeDistributor(chainId: number, address: string): PrizeDistributor | undefined {
    return this.prizeDistributors.find(
      (prizeDistributor) =>
        prizeDistributor.chainId === chainId && prizeDistributor.address === address
    )
  }
}
