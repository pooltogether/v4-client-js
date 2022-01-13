[@pooltogether/v4-js-client](../README.md) / [Exports](../modules.md) / User

# Class: User

A User for a PrizePool.
Provides read & write functionality for a Prize Pool. Reads use the provider from the PrizePool. Writes use the signer from the contructor. Throws an error if a write is triggered with a signer that does not match the network of the Prize Pool.

## Hierarchy

- [`PrizePool`](PrizePool.md)

  ↳ **`User`**

## Table of contents

### Constructors

- [constructor](User.md#constructor)

### Properties

- [address](User.md#address)
- [chainId](User.md#chainid)
- [contractMetadataList](User.md#contractmetadatalist)
- [prizePoolContract](User.md#prizepoolcontract)
- [prizePoolMetadata](User.md#prizepoolmetadata)
- [signer](User.md#signer)
- [signerOrProvider](User.md#signerorprovider)
- [ticketContract](User.md#ticketcontract)
- [ticketMetadata](User.md#ticketmetadata)
- [tokenContract](User.md#tokencontract)
- [tokenMetadata](User.md#tokenmetadata)

### Methods

- [approveDeposits](User.md#approvedeposits)
- [delegateTickets](User.md#delegatetickets)
- [deposit](User.md#deposit)
- [depositAndDelegate](User.md#depositanddelegate)
- [getDepositAllowance](User.md#getdepositallowance)
- [getTicketBalance](User.md#getticketbalance)
- [getTicketContract](User.md#getticketcontract)
- [getTicketData](User.md#getticketdata)
- [getTicketDelegate](User.md#getticketdelegate)
- [getTicketTotalSupply](User.md#gettickettotalsupply)
- [getTokenBalance](User.md#gettokenbalance)
- [getTokenContract](User.md#gettokencontract)
- [getTokenData](User.md#gettokendata)
- [getUsersDepositAllowance](User.md#getusersdepositallowance)
- [getUsersPrizePoolBalances](User.md#getusersprizepoolbalances)
- [getUsersTicketBalance](User.md#getusersticketbalance)
- [getUsersTicketDelegate](User.md#getusersticketdelegate)
- [getUsersTicketTwabAt](User.md#getuserstickettwabat)
- [getUsersTokenBalance](User.md#getuserstokenbalance)
- [id](User.md#id)
- [selfDelegateTickets](User.md#selfdelegatetickets)
- [validateSignerNetwork](User.md#validatesignernetwork)
- [withdraw](User.md#withdraw)

## Constructors

### constructor

• **new User**(`prizePoolMetadata`, `signer`, `prizePool`)

Creates an instance of a User for a specific PrizePool

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `prizePoolMetadata` | [`Contract`](../interfaces/Contract.md) | - |
| `signer` | `Signer` | signer to submit transactions with |
| `prizePool` | [`PrizePool`](PrizePool.md) | PrizePool that the User should interact with |

#### Overrides

[PrizePool](PrizePool.md).[constructor](PrizePool.md#constructor)

#### Defined in

[src/User.ts:23](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L23)

## Properties

### address

• `Readonly` **address**: `string`

#### Inherited from

[PrizePool](PrizePool.md).[address](PrizePool.md#address)

#### Defined in

[src/PrizePool.ts:30](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L30)

___

### chainId

• `Readonly` **chainId**: `number`

#### Inherited from

[PrizePool](PrizePool.md).[chainId](PrizePool.md#chainid)

#### Defined in

[src/PrizePool.ts:29](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L29)

___

### contractMetadataList

• `Readonly` **contractMetadataList**: [`Contract`](../interfaces/Contract.md)[]

#### Inherited from

[PrizePool](PrizePool.md).[contractMetadataList](PrizePool.md#contractmetadatalist)

#### Defined in

[src/PrizePool.ts:27](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L27)

___

### prizePoolContract

• `Readonly` **prizePoolContract**: `Contract`

#### Inherited from

[PrizePool](PrizePool.md).[prizePoolContract](PrizePool.md#prizepoolcontract)

#### Defined in

[src/PrizePool.ts:38](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L38)

___

### prizePoolMetadata

• `Readonly` **prizePoolMetadata**: [`Contract`](../interfaces/Contract.md)

#### Inherited from

[PrizePool](PrizePool.md).[prizePoolMetadata](PrizePool.md#prizepoolmetadata)

#### Defined in

[src/PrizePool.ts:33](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L33)

___

### signer

• `Readonly` **signer**: `Signer`

#### Defined in

[src/User.ts:16](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L16)

___

### signerOrProvider

• `Readonly` **signerOrProvider**: `Signer` \| `Provider`

#### Inherited from

[PrizePool](PrizePool.md).[signerOrProvider](PrizePool.md#signerorprovider)

#### Defined in

[src/PrizePool.ts:28](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L28)

___

### ticketContract

• **ticketContract**: `undefined` \| `Contract`

#### Inherited from

[PrizePool](PrizePool.md).[ticketContract](PrizePool.md#ticketcontract)

#### Defined in

[src/PrizePool.ts:39](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L39)

___

### ticketMetadata

• **ticketMetadata**: `undefined` \| [`Contract`](../interfaces/Contract.md)

#### Inherited from

[PrizePool](PrizePool.md).[ticketMetadata](PrizePool.md#ticketmetadata)

#### Defined in

[src/PrizePool.ts:34](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L34)

___

### tokenContract

• **tokenContract**: `undefined` \| `Contract`

#### Inherited from

[PrizePool](PrizePool.md).[tokenContract](PrizePool.md#tokencontract)

#### Defined in

[src/PrizePool.ts:40](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L40)

___

### tokenMetadata

• **tokenMetadata**: `undefined` \| [`Contract`](../interfaces/Contract.md)

#### Inherited from

[PrizePool](PrizePool.md).[tokenMetadata](PrizePool.md#tokenmetadata)

#### Defined in

[src/PrizePool.ts:35](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L35)

## Methods

### approveDeposits

▸ **approveDeposits**(`amountUnformatted?`, `overrides?`): `Promise`<`TransactionResponse`\>

Submits a transaction to set an allowance for deposits into the Prize Pool.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amountUnformatted?` | `BigNumber` | an unformatted and decimal shifted amount to approve for deposits |
| `overrides?` | `Overrides` | optional overrides for the transaction creation |

#### Returns

`Promise`<`TransactionResponse`\>

the transaction response

#### Defined in

[src/User.ts:110](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L110)

___

### delegateTickets

▸ **delegateTickets**(`address`, `overrides?`): `Promise`<`TransactionResponse`\>

Delegates the users ticket chance to the provided address

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | the address to delegate to |
| `overrides?` | `Overrides` | optional overrides for the transaction creation |

#### Returns

`Promise`<`TransactionResponse`\>

the transaction response

#### Defined in

[src/User.ts:149](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L149)

___

### deposit

▸ **deposit**(`amountUnformatted`, `overrides?`): `Promise`<`TransactionResponse`\>

Submits a transaction to deposit a controlled token into the Prize Pool to the Signer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amountUnformatted` | `BigNumber` | an unformatted and decimal shifted amount to deposit from the prize pool |
| `overrides?` | `Overrides` | optional overrides for the transaction creation |

#### Returns

`Promise`<`TransactionResponse`\>

the transaction response

#### Defined in

[src/User.ts:58](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L58)

___

### depositAndDelegate

▸ **depositAndDelegate**(`amountUnformatted`, `to?`, `overrides?`): `Promise`<`TransactionResponse`\>

Submits a transaction to deposit a controlled token into the Prize Pool to the Signer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amountUnformatted` | `BigNumber` | an unformatted and decimal shifted amount to deposit from the prize pool |
| `to?` | `string` | - |
| `overrides?` | `Overrides` | optional overrides for the transaction creation |

#### Returns

`Promise`<`TransactionResponse`\>

the transaction response

#### Defined in

[src/User.ts:76](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L76)

___

### getDepositAllowance

▸ **getDepositAllowance**(): `Promise`<{ `allowanceUnformatted`: `BigNumber` ; `isApproved`: `boolean` = !allowanceUnformatted.isZero() }\>

Fetches the allowance the User has for depositing into the Prize Pool.

#### Returns

`Promise`<{ `allowanceUnformatted`: `BigNumber` ; `isApproved`: `boolean` = !allowanceUnformatted.isZero() }\>

the allowance the user has set for deposits

#### Defined in

[src/User.ts:186](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L186)

___

### getTicketBalance

▸ **getTicketBalance**(): `Promise`<`BigNumber`\>

Fetches the Users ticket balance.

#### Returns

`Promise`<`BigNumber`\>

the users ticket balance

#### Defined in

[src/User.ts:168](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L168)

___

### getTicketContract

▸ **getTicketContract**(): `Promise`<`Contract`\>

Fetches the addresses to build an instance of an ethers Contract for the Ticket

#### Returns

`Promise`<`Contract`\>

an ethers contract for the ticket

#### Inherited from

[PrizePool](PrizePool.md).[getTicketContract](PrizePool.md#getticketcontract)

#### Defined in

[src/PrizePool.ts:273](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L273)

___

### getTicketData

▸ **getTicketData**(): `Promise`<[`TokenData`](../interfaces/TokenData.md)\>

Fetches decimals, name and symbol for the Ticket.

#### Returns

`Promise`<[`TokenData`](../interfaces/TokenData.md)\>

decimals, name and symbol for the ticket

#### Inherited from

[PrizePool](PrizePool.md).[getTicketData](PrizePool.md#getticketdata)

#### Defined in

[src/PrizePool.ts:201](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L201)

___

### getTicketDelegate

▸ **getTicketDelegate**(): `Promise`<`string`\>

Fetches the address the user has delegated to

#### Returns

`Promise`<`string`\>

the address the user has delegated to

#### Defined in

[src/User.ts:195](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L195)

___

### getTicketTotalSupply

▸ **getTicketTotalSupply**(): `Promise`<`BigNumber`\>

Fetches total supply for the Ticket.

#### Returns

`Promise`<`BigNumber`\>

the total supply of the ticket

#### Inherited from

[PrizePool](PrizePool.md).[getTicketTotalSupply](PrizePool.md#gettickettotalsupply)

#### Defined in

[src/PrizePool.ts:213](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L213)

___

### getTokenBalance

▸ **getTokenBalance**(): `Promise`<`BigNumber`\>

Fetches the Users token (underlying token) balance.

#### Returns

`Promise`<`BigNumber`\>

the users underlying token balance

#### Defined in

[src/User.ts:177](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L177)

___

### getTokenContract

▸ **getTokenContract**(): `Promise`<`Contract`\>

Fetches the addresses to build an instance of an ethers Contract for the underlying Token

#### Returns

`Promise`<`Contract`\>

an ethers contract for the underlying token

#### Inherited from

[PrizePool](PrizePool.md).[getTokenContract](PrizePool.md#gettokencontract)

#### Defined in

[src/PrizePool.ts:296](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L296)

___

### getTokenData

▸ **getTokenData**(): `Promise`<[`TokenData`](../interfaces/TokenData.md)\>

Fetches decimals, name and symbol for the underling Token.

#### Returns

`Promise`<[`TokenData`](../interfaces/TokenData.md)\>

decimals, name and symbol for the underling token

#### Inherited from

[PrizePool](PrizePool.md).[getTokenData](PrizePool.md#gettokendata)

#### Defined in

[src/PrizePool.ts:189](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L189)

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

#### Inherited from

[PrizePool](PrizePool.md).[getUsersDepositAllowance](PrizePool.md#getusersdepositallowance)

#### Defined in

[src/PrizePool.ts:159](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L159)

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

#### Inherited from

[PrizePool](PrizePool.md).[getUsersPrizePoolBalances](PrizePool.md#getusersprizepoolbalances)

#### Defined in

[src/PrizePool.ts:93](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L93)

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

#### Inherited from

[PrizePool](PrizePool.md).[getUsersTicketBalance](PrizePool.md#getusersticketbalance)

#### Defined in

[src/PrizePool.ts:114](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L114)

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

#### Inherited from

[PrizePool](PrizePool.md).[getUsersTicketDelegate](PrizePool.md#getusersticketdelegate)

#### Defined in

[src/PrizePool.ts:176](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L176)

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

#### Inherited from

[PrizePool](PrizePool.md).[getUsersTicketTwabAt](PrizePool.md#getuserstickettwabat)

#### Defined in

[src/PrizePool.ts:129](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L129)

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

#### Inherited from

[PrizePool](PrizePool.md).[getUsersTokenBalance](PrizePool.md#getuserstokenbalance)

#### Defined in

[src/PrizePool.ts:145](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L145)

___

### id

▸ **id**(): `string`

Returns a unique id string for this Prize Pool.

#### Returns

`string`

a unique id for the Prize Pool

#### Inherited from

[PrizePool](PrizePool.md).[id](PrizePool.md#id)

#### Defined in

[src/PrizePool.ts:82](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/PrizePool.ts#L82)

___

### selfDelegateTickets

▸ **selfDelegateTickets**(`overrides?`): `Promise`<`TransactionResponse`\>

Submits a transaction to delegate to ticket chance to the users self

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `overrides?` | `Overrides` | optional overrides for the transaction creation |

#### Returns

`Promise`<`TransactionResponse`\>

the transaction response

#### Defined in

[src/User.ts:131](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L131)

___

### validateSignerNetwork

▸ **validateSignerNetwork**(`errorPrefix`): `Promise`<`void`\>

Validates the provided signers network.
Throws if it does not match the expected network.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `errorPrefix` | `string` | the class and function name of where the error occurred |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/User.ts:207](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L207)

___

### withdraw

▸ **withdraw**(`amountUnformatted`, `overrides?`): `Promise`<`TransactionResponse`\>

Submits a transaction to withdraw a controlled token from the Prize Pool to the Signer.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `amountUnformatted` | `BigNumber` | an unformatted and decimal shifted amount to withdraw from the prize pool |
| `overrides?` | `Overrides` | optional overrides for the transaction creation |

#### Returns

`Promise`<`TransactionResponse`\>

the transaction response

#### Defined in

[src/User.ts:37](https://github.com/pooltogether/v4-js-client/blob/6c47059/src/User.ts#L37)
