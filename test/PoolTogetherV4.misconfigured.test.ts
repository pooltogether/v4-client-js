import PoolTogetherV4 from "../src";
import { ADDRESS_DEAD } from "./constants";

describe("PoolTogetherV4", () => {
  let pt4: PoolTogetherV4;

  beforeAll(() => {
    pt4 = new PoolTogetherV4(undefined, undefined);
  });

  it("should fail to get a contract.", async () => {
    const contract = pt4.getContract(ADDRESS_DEAD);
    expect(contract?.interface).toBeFalsy();
  });

  it("should fail to get contracts.", async () => {
    const contracts = pt4.getContracts([ADDRESS_DEAD]);
    expect(contracts).toEqual([undefined]);
  });

  it("should fail to get contract list.", async () => {
    const contracts = pt4.getContractList();
    expect(contracts).toBeUndefined();
  });

  it("should fail to get a provider.", async () => {
    const provider = pt4.getProvider(1);
    expect(provider).toBeUndefined();
  });

  it("should fail to get a providers.", async () => {
    const providers = pt4.getProviders([1, 4]);
    expect(providers).toEqual([undefined, undefined]);
  });

  it("should fail to get a provider list.", async () => {
    const providers = pt4.getProviderList();
    expect(providers).toBeUndefined();
  });

  it("should fail to get Infura provider.", async () => {
    const provider = pt4.getInfuraProvider(4);
    expect(provider?._isProvider).toBeFalsy();
  });
});
