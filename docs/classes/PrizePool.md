[@pooltogether/v4-client-js](../README.md) / [Exports](../modules.md) / PrizePool

# Class: PrizePool

A Prize Pool.
Provides read only functions for the contracts that make up the deployment of this Prize Pool.

## Hierarchy

- **`PrizePool`**

  ↳ [`User`](User.md)

## Table of contents

### Constructors

- [constructor](PrizePool.md#constructor)

### Properties

- [address](PrizePool.md#address)
- [chainId](PrizePool.md#chainid)
- [contractMetadataList](PrizePool.md#contractmetadatalist)
- [prizePoolContract](PrizePool.md#prizepoolcontract)
- [prizePoolMetadata](PrizePool.md#prizepoolmetadata)
- [signerOrProvider](PrizePool.md#signerorprovider)
- [ticketContract](PrizePool.md#ticketcontract)
- [ticketMetadata](PrizePool.md#ticketmetadata)
- [tokenContract](PrizePool.md#tokencontract)
- [tokenMetadata](PrizePool.md#tokenmetadata)

### Methods

- [getTicketContract](PrizePool.md#getticketcontract)
- [getTicketData](PrizePool.md#getticketdata)
- [getTicketTotalSupply](PrizePool.md#gettickettotalsupply)
- [getTokenContract](PrizePool.md#gettokencontract)
- [getTokenData](PrizePool.md#gettokendata)
- [getUsersDepositAllowance](PrizePool.md#getusersdepositallowance)
- [getUsersPrizePoolBalances](PrizePool.md#getusersprizepoolbalances)
- [getUsersTicketBalance](PrizePool.md#getusersticketbalance)
- [getUsersTicketDelegate](PrizePool.md#getusersticketdelegate)
- [getUsersTicketTwabAt](PrizePool.md#getuserstickettwabat)
- [getUsersTokenBalance](PrizePool.md#getuserstokenbalance)
- [id](PrizePool.md#id)

## Constructors

### constructor

• **new PrizePool**(`prizePoolMetadata`, `signerOrProvider`, `contractMetadataList`)

Create an instance of a PrizePool by providing the metadata for the YieldSourcePrizePool contract, an ethers Provider or Signer for the network the Prize Pool is deployed on and a list of contract metadata for the other contracts that make up the Prize Pool.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `prizePoolMetadata` | [`Contract`](../interfaces/Contract.md) | the metadata for the YieldSourcePrizePool contract in the Prize Pool |
| `signerOrProvider` | `Signer` \| `Provider` | a Provider or Signer for the network the Prize Pool deployment is on |
| `contractMetadataList` | [`Contract`](../interfaces/Contract.md)[] | an array of metadata for the Prize Pool |

#### Defined in

[src/PrizePool.ts:49](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L49)

## Properties

### address

• `Readonly` **address**: `string`

#### Defined in

[src/PrizePool.ts:30](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L30)

___

### chainId

• `Readonly` **chainId**: `number`

#### Defined in

[src/PrizePool.ts:29](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L29)

___

### contractMetadataList

• `Readonly` **contractMetadataList**: [`Contract`](../interfaces/Contract.md)[]

#### Defined in

[src/PrizePool.ts:27](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L27)

___

### prizePoolContract

• `Readonly` **prizePoolContract**: `Contract`

#### Defined in

[src/PrizePool.ts:38](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L38)

___

### prizePoolMetadata

• `Readonly` **prizePoolMetadata**: [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizePool.ts:33](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L33)

___

### signerOrProvider

• `Readonly` **signerOrProvider**: `Signer` \| `Provider`

#### Defined in

[src/PrizePool.ts:28](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L28)

___

### ticketContract

• **ticketContract**: `undefined` \| `Contract`

#### Defined in

[src/PrizePool.ts:39](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L39)

___

### ticketMetadata

• **ticketMetadata**: `undefined` \| [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizePool.ts:34](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L34)

___

### tokenContract

• **tokenContract**: `undefined` \| `Contract`

#### Defined in

[src/PrizePool.ts:40](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L40)

___

### tokenMetadata

• **tokenMetadata**: `undefined` \| [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizePool.ts:35](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L35)

## Methods

### getTicketContract

▸ **getTicketContract**(): `Promise`<`Contract`\>

Fetches the addresses to build an instance of an ethers Contract for the Ticket

#### Returns

`Promise`<`Contract`\>

an ethers contract for the ticket

#### Defined in

[src/PrizePool.ts:273](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L273)

___

### getTicketData

▸ **getTicketData**(): `Promise`<[`TokenData`](../interfaces/TokenData.md)\>

Fetches decimals, name and symbol for the Ticket.

#### Returns

`Promise`<[`TokenData`](../interfaces/TokenData.md)\>

decimals, name and symbol for the ticket

#### Defined in

[src/PrizePool.ts:201](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L201)

___

### getTicketTotalSupply

▸ **getTicketTotalSupply**(): `Promise`<`BigNumber`\>

Fetches total supply for the Ticket.

#### Returns

`Promise`<`BigNumber`\>

the total supply of the ticket

#### Defined in

[src/PrizePool.ts:213](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L213)

___

### getTokenContract

▸ **getTokenContract**(): `Promise`<`Contract`\>

Fetches the addresses to build an instance of an ethers Contract for the underlying Token

#### Returns

`Promise`<`Contract`\>

an ethers contract for the underlying token

#### Defined in

[src/PrizePool.ts:296](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L296)

___

### getTokenData

▸ **getTokenData**(): `Promise`<[`TokenData`](../interfaces/TokenData.md)\>

Fetches decimals, name and symbol for the underling Token.

#### Returns

`Promise`<[`TokenData`](../interfaces/TokenData.md)\>

decimals, name and symbol for the underling token

#### Defined in

[src/PrizePool.ts:189](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L189)

___

### getUsersDepositAllowance

▸ **getUsersDepositAllowance**(`usersAddress`): `Promise`<{ `allowanceUnformatted`: `BigNumber` ; `isApproved`: `boolean` = !allowanceUnformatted.isZero() }\>

Fetches a users deposit allowance for the Prize Pool.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | the address to fetch the deposit allowance for |

#### Returns

`Promise`<{ `allowanceUnformatted`: `BigNumber` ; `isApproved`: `boolean` = !allowanceUnformatted.isZero() }\>

the amount the user has approved for deposits

#### Defined in

[src/PrizePool.ts:159](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L159)

___

### getUsersPrizePoolBalances

▸ **getUsersPrizePoolBalances**(`usersAddress`): `Promise`<[`PrizePoolTokenBalances`](../interfaces/PrizePoolTokenBalances.md)\>

Fetches a users balances for the Prize Pool underlying Token and Ticket.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | the users address to fetch balances for |

#### Returns

`Promise`<[`PrizePoolTokenBalances`](../interfaces/PrizePoolTokenBalances.md)\>

the users balances for the underlying deposit token and the ticket token

#### Defined in

[src/PrizePool.ts:93](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L93)

___

### getUsersTicketBalance

▸ **getUsersTicketBalance**(`usersAddress`): `Promise`<`BigNumber`\>

Fetches a users balance for the Prize Pools Ticket.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | the address to fetch the balance for |

#### Returns

`Promise`<`BigNumber`\>

the users ticket balance

#### Defined in

[src/PrizePool.ts:114](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L114)

___

### getUsersTicketDelegate

▸ **getUsersTicketDelegate**(`usersAddress`): `Promise`<`string`\>

Fetches the address a user has delegated to.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | the address to fetch the delegate for |

#### Returns

`Promise`<`string`\>

the address a user has delegated to

#### Defined in

[src/PrizePool.ts:176](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L176)

___

### getUsersTicketTwabAt

▸ **getUsersTicketTwabAt**(`usersAddress`, `unixTimestamp`): `Promise`<`BigNumber`\>

Fetches a users Ticket TWAB at a specific unix timestamp.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | the address to fetch the ticket TWAB for |
| `unixTimestamp` | `number` | the unix timestamp to fetch in seconds |

#### Returns

`Promise`<`BigNumber`\>

the users TWAB at the requested time

#### Defined in

[src/PrizePool.ts:129](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L129)

___

### getUsersTokenBalance

▸ **getUsersTokenBalance**(`usersAddress`): `Promise`<`BigNumber`\>

Fetches a users balance for the Prize Pools underlying Token.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | the address to fetch the balance for |

#### Returns

`Promise`<`BigNumber`\>

the users token balance

#### Defined in

[src/PrizePool.ts:145](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L145)

___

### id

▸ **id**(): `string`

Returns a unique id string for this Prize Pool.

#### Returns

`string`

a unique id for the Prize Pool

#### Defined in

[src/PrizePool.ts:82](https://github.com/pooltogether/v4-client-js/blob/7357147/src/PrizePool.ts#L82)
