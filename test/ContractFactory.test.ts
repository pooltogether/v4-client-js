import { constants } from 'ethers'
import { getReadProviders } from '@pooltogether/utilities'
import { ContractFactory } from '../src/ContractFactory'
import { contactList, ADDRESS_DEAD, CHAIN_ID } from './constants'
import { ContractList, SignersOrProviders } from '../src/types'

describe('ContractFactory', () => {
  let cf: ContractFactory

  beforeAll(() => {
    cf = new ContractFactory(getReadProviders([CHAIN_ID]), contactList)
  })

  beforeEach(() => {})

  it('should throw if no signers or providers were given.', async () => {
    const t = () => {
      cf = new ContractFactory((null as unknown) as SignersOrProviders, contactList)
    }
    expect(t).toThrow(`signersOrProviders is required`)
  })

  it('should throw if no contract list was given.', async () => {
    const t = () => {
      cf = new ContractFactory(getReadProviders([CHAIN_ID]), (null as unknown) as ContractList)
    }
    expect(t).toThrow(`contractList is required`)
  })

  it('should succeed to get a contract.', async () => {
    const contract = cf.getContract(CHAIN_ID, ADDRESS_DEAD)
    expect(contract?.interface).toBeTruthy()
  })

  it('should throw when getting an invalid contract.', async () => {
    const t = () => {
      cf.getContract(CHAIN_ID, constants.AddressZero)
    }
    expect(t).toThrow(
      `Contract not found for chainId: ${CHAIN_ID} and address: ${constants.AddressZero}`
    )
  })

  it('should succeed to get contracts.', async () => {
    const contracts = cf.getContracts([{ chainId: CHAIN_ID, address: ADDRESS_DEAD }])
    // @ts-ignore
    expect(contracts[0]?.interface).toBeTruthy()
  })

  it('should succeed to get contract list.', async () => {
    const contracts = cf.getContractList()
    expect(contracts?.version).toBeTruthy()
  })

  it('should succeed to get a provider.', async () => {
    const signerOrProvider = cf.getSignerOrProvider(1)
    // @ts-ignore
    const isValid = !!signerOrProvider?.getCode
    expect(isValid).toBeTruthy()
  })

  it('should succeed to get a providers.', async () => {
    const signersOrProviders = cf.getSignersOrProviders()
    // @ts-ignore

    const isValid = !!signersOrProviders?.[CHAIN_ID]?.getCode
    expect(isValid).toBeTruthy()
  })
})
