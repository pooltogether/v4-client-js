import { RSV } from 'eth-permit/dist/rpc'

import { EIP2612SignatureTuple } from '../types'

export const formatEIP2612SignatureTuple = (
  rawSignature: { deadline: string | number } & RSV
): EIP2612SignatureTuple => {
  // NOTE: This workaround is required for hardware wallets
  // https://ethereum.stackexchange.com/questions/103307/cannot-verifiy-a-signature-produced-by-ledger-in-solidity-using-ecrecover
  const v = rawSignature.v < 27 ? rawSignature.v + 27 : rawSignature.v

  const signatureTuple: EIP2612SignatureTuple = {
    deadline: Number(rawSignature.deadline),
    v: v,
    r: rawSignature.r,
    s: rawSignature.s
  }

  return signatureTuple
}
