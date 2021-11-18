import { Contract } from "@ethersproject/contracts";
import { BigNumber, BigNumberish } from "ethers";

export async function getMultiTicketAverageTotalSuppliesBetween(
  tickets: Array<Contract | undefined>,
  startTime?: BigNumberish,
  endTime?: BigNumberish
): Promise<BigNumber[] | undefined> {
  if (!tickets || !startTime || !endTime) return undefined;
  return await Promise.all(
    tickets.map(async contract => {
      if (!contract) return undefined;
      return (
        await contract.getAverageTotalSuppliesBetween([startTime], [endTime])
      )[0];
    })
  );
}

export default getMultiTicketAverageTotalSuppliesBetween;
