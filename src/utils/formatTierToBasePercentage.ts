import { parseUnits } from "@ethersproject/units";

import { TIER_DENOMINATION } from "../constants";

export function formatTierToBasePercentage(distribution: string) {
  return parseUnits(distribution, TIER_DENOMINATION);
}
