import * as bridging from "./bridging";
import * as chains from "./chains";
import * as networks from "./networks";
import * as providers from "./providers";
const config = {
  bridging,
  chains,
  networks,
  providers,
};
export * from "./bridging";
export * from "./chains";
export * from "./networks";
export * from "./providers";
export { config };
export default config;
