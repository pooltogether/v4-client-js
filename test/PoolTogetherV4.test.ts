import { constants } from "ethers";
import PoolTogetherV4, { config } from "../src";
import { contactList, ADDRESS_DEAD } from "./constants";

describe("PoolTogetherV4", () => {
  let pt4: PoolTogetherV4;

  beforeAll(() => {
    pt4 = new PoolTogetherV4(config.providers.providersAll, contactList, {
      infuraApiKey: 'test',
    });
  });

  beforeEach(() => { });

  it("should succeed to initialize PoolTogetherV4", async () => {
    expect(pt4.isInitialized).toBeTruthy();
  });

  it("should succeed to set providers", async () => {
    pt4.setProviders(config.providers.providersAll);
    expect(pt4.getProvider(4)).toBeTruthy();
  });

  it("should succeed to set contractList", async () => {
    pt4.setContractList(contactList);
    expect(pt4.contractList).toBeTruthy();
  });

  it("should succeed to set configuration", async () => {
    pt4.setConfiguration({ infuraApiKey: 'test' });
    expect(pt4?.config?.infuraApiKey).toBeTruthy();
  });

  it("should succeed to set configuration", async () => {
    pt4.setConfiguration({ infuraApiKey: 'test' });
    expect(pt4?.config?.infuraApiKey).toBeTruthy();
  });

  it("should succeed to get a contract.", async () => {
    const contract = pt4.getContract(ADDRESS_DEAD);
    expect(contract?.interface).toBeTruthy();
  });

  it("should fail to get a contract from initialize contractList.", async () => {
    const contract = pt4.getContract(constants.AddressZero);
    expect(contract).toBeUndefined();
  });

  it("should succeed to get contracts.", async () => {
    const contracts = pt4.getContracts([ADDRESS_DEAD]);
    // @ts-ignore
    expect(contracts[0]?.interface).toBeTruthy();
  });

  it("should succeed to get contract list.", async () => {
    const contracts = pt4.getContractList();
    expect(contracts?.version).toBeTruthy();
  });

  it("should succeed to get a provider.", async () => {
    const provider = pt4.getProvider(1);
    expect(provider?._isProvider).toBeTruthy();
  });

  it("should succeed to get a providers.", async () => {
    const providers = pt4.getProviders([1, 4]);
    // @ts-ignore
    expect(providers[0]._isProvider).toBeTruthy();
  });

  it("should succeed to get a provider list.", async () => {
    const providers = pt4.getProviderList();
    // @ts-ignore
    expect(providers[1]._isProvider).toBeTruthy();
  });

  it("should succeed to get Infura provider.", async () => {
    const provider = pt4.getInfuraProvider(4);
    expect(provider?._isProvider).toBeTruthy();
  });
});
