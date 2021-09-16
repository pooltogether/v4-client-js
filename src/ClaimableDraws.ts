import { getContractsByType } from './LinkedPrizePool'
import { ContractType } from './constants'
import { Contract } from './types'

export class ClaimableDraws {
  readonly claimableDraws: ClaimableDraw[]
  readonly contractMetadatas: Contract[]

  constructor(contracts: Contract[]) {
    const claimableDrawContracts = getContractsByType(contracts, ContractType.ClaimableDraw)
    this.contractMetadatas = claimableDrawContracts
    this.claimableDraws = claimableDrawContracts.map((contract) => new ClaimableDraw(contracts))
  }
}

export class ClaimableDraw {
  readonly contractMetadatas: Contract[]

  constructor(contracts: Contract[]) {
    this.contractMetadatas = contracts
  }
}
