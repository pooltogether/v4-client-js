[@pooltogether/v4-client-js](../README.md) / [Exports](../modules.md) / PrizePoolNetwork

# Class: PrizePoolNetwork

A Prize Pool Network.
The network consists of one or more Prize Pools and Prize Distributors. PrizePoolNetwork provides read only functions for reading data from the contracts that make up the network. Initializes several PrizePools and PrizeDistributors on creation.

## Table of contents

### Constructors

- [constructor](PrizePoolNetwork.md#constructor)

### Properties

- [beaconAddress](PrizePoolNetwork.md#beaconaddress)
- [beaconChainId](PrizePoolNetwork.md#beaconchainid)
- [contractList](PrizePoolNetwork.md#contractlist)
- [drawBeaconContract](PrizePoolNetwork.md#drawbeaconcontract)
- [drawBeaconMetadata](PrizePoolNetwork.md#drawbeaconmetadata)
- [drawBufferContract](PrizePoolNetwork.md#drawbuffercontract)
- [drawBufferMetadata](PrizePoolNetwork.md#drawbuffermetadata)
- [prizeDistributors](PrizePoolNetwork.md#prizedistributors)
- [prizePools](PrizePoolNetwork.md#prizepools)
- [prizeTierHistoryContract](PrizePoolNetwork.md#prizetierhistorycontract)
- [prizeTierHistoryMetadata](PrizePoolNetwork.md#prizetierhistorymetadata)
- [providers](PrizePoolNetwork.md#providers)

### Methods

- [getBeaconChainDrawIds](PrizePoolNetwork.md#getbeaconchaindrawids)
- [getBeaconChainDraws](PrizePoolNetwork.md#getbeaconchaindraws)
- [getDrawBeaconPeriod](PrizePoolNetwork.md#getdrawbeaconperiod)
- [getPrizeDistributor](PrizePoolNetwork.md#getprizedistributor)
- [getPrizePool](PrizePoolNetwork.md#getprizepool)
- [getUpcomingPrizeTier](PrizePoolNetwork.md#getupcomingprizetier)
- [getUsersPrizePoolBalances](PrizePoolNetwork.md#getusersprizepoolbalances)
- [id](PrizePoolNetwork.md#id)

## Constructors

### constructor

• **new PrizePoolNetwork**(`providers`, `prizePoolNetworkContractList`)

Create an instance of a PrizePoolNetwork by providing ethers Providers for each relevant network and a Contract List.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `providers` | [`Providers`](../interfaces/Providers.md) | ethers Providers for each network in the Prize Pool Network, keyed by their chain id. |
| `prizePoolNetworkContractList` | [`ContractList`](../interfaces/ContractList.md) | a Contract List containing all of the relevant metadata for the Prize Pool Network. |

#### Defined in

[src/PrizePoolNetwork.ts:41](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L41)

## Properties

### beaconAddress

• `Readonly` **beaconAddress**: `string`

#### Defined in

[src/PrizePoolNetwork.ts:23](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L23)

___

### beaconChainId

• `Readonly` **beaconChainId**: `number`

#### Defined in

[src/PrizePoolNetwork.ts:22](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L22)

___

### contractList

• `Readonly` **contractList**: [`ContractList`](../interfaces/ContractList.md)

#### Defined in

[src/PrizePoolNetwork.ts:19](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L19)

___

### drawBeaconContract

• `Readonly` **drawBeaconContract**: `Contract`

#### Defined in

[src/PrizePoolNetwork.ts:31](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L31)

___

### drawBeaconMetadata

• `Readonly` **drawBeaconMetadata**: [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizePoolNetwork.ts:26](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L26)

___

### drawBufferContract

• `Readonly` **drawBufferContract**: `Contract`

#### Defined in

[src/PrizePoolNetwork.ts:32](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L32)

___

### drawBufferMetadata

• `Readonly` **drawBufferMetadata**: [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizePoolNetwork.ts:27](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L27)

___

### prizeDistributors

• `Readonly` **prizeDistributors**: [`PrizeDistributor`](PrizeDistributor.md)[]

#### Defined in

[src/PrizePoolNetwork.ts:18](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L18)

___

### prizePools

• `Readonly` **prizePools**: [`PrizePool`](PrizePool.md)[]

#### Defined in

[src/PrizePoolNetwork.ts:17](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L17)

___

### prizeTierHistoryContract

• `Readonly` **prizeTierHistoryContract**: `Contract`

#### Defined in

[src/PrizePoolNetwork.ts:33](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L33)

___

### prizeTierHistoryMetadata

• `Readonly` **prizeTierHistoryMetadata**: [`Contract`](../interfaces/Contract.md)

#### Defined in

[src/PrizePoolNetwork.ts:28](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L28)

___

### providers

• `Readonly` **providers**: [`Providers`](../interfaces/Providers.md)

#### Defined in

[src/PrizePoolNetwork.ts:16](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L16)

## Methods

### getBeaconChainDrawIds

▸ **getBeaconChainDrawIds**(): `Promise`<`number`[]\>

Fetch the range of available draw ids in the Draw Buffer for the beacon Prize Pool.

#### Returns

`Promise`<`number`[]\>

an array of draw ids

#### Defined in

[src/PrizePoolNetwork.ts:143](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L143)

___

### getBeaconChainDraws

▸ **getBeaconChainDraws**(): `Promise`<{ [drawId: number]: [`Draw`](../interfaces/Draw.md);  }\>

Fetch all of the available Draws in the Draw Buffer for the beacon Prize Pool.

#### Returns

`Promise`<{ [drawId: number]: [`Draw`](../interfaces/Draw.md);  }\>

an object of draws keyed by their draw id

#### Defined in

[src/PrizePoolNetwork.ts:168](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L168)

___

### getDrawBeaconPeriod

▸ **getDrawBeaconPeriod**(): `Promise`<{ `drawId`: `number` ; `endsAtSeconds`: `BigNumber` ; `periodSeconds`: `number` ; `startedAtSeconds`: `BigNumber`  }\>

Fetch the current Draw Beacon period data from the beacon Prize Pool.

#### Returns

`Promise`<{ `drawId`: `number` ; `endsAtSeconds`: `BigNumber` ; `periodSeconds`: `number` ; `startedAtSeconds`: `BigNumber`  }\>

the current draw beacon period.

#### Defined in

[src/PrizePoolNetwork.ts:121](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L121)

___

### getPrizeDistributor

▸ **getPrizeDistributor**(`chainId`, `address`): `undefined` \| [`PrizeDistributor`](PrizeDistributor.md)

Returns a PrizeDistributor from the list of Prize Distributors that was created on initialization by their primary key. The primary key of a Prize Disctributor is the chain id it is on and the address of the PrizeDistributor contract.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `number` | the chain id the requested prize distributor is on |
| `address` | `string` | the address of the PrizeDistributor contract |

#### Returns

`undefined` \| [`PrizeDistributor`](PrizeDistributor.md)

#### Defined in

[src/PrizePoolNetwork.ts:218](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L218)

___

### getPrizePool

▸ **getPrizePool**(`chainId`, `address`): `undefined` \| [`PrizePool`](PrizePool.md)

Returns a PrizePool from the list of Prize Pools that was created on initialization by their primary key. The primary key of a Prize Pool is the chain id it is on and the address of the YieldSourcePrizePool contract.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `number` | the chain id the requested prize pool is on |
| `address` | `string` | the address of the YieldSourcePrizePool contract |

#### Returns

`undefined` \| [`PrizePool`](PrizePool.md)

#### Defined in

[src/PrizePoolNetwork.ts:206](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L206)

___

### getUpcomingPrizeTier

▸ **getUpcomingPrizeTier**(): `Promise`<[`PrizeTier`](../modules.md#prizetier)\>

Fetches the upcoming prize tier data from the prize tier history contract. This data is used for the next prize distribution that will be added to the Prize Distribution Buffer for the beacon Prize Pool.

#### Returns

`Promise`<[`PrizeTier`](../modules.md#prizetier)\>

the upcoming prize tier

#### Defined in

[src/PrizePoolNetwork.ts:188](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L188)

___

### getUsersPrizePoolBalances

▸ **getUsersPrizePoolBalances**(`usersAddress`): `Promise`<{ `address`: `string` = prizePool.address; `balances`: [`PrizePoolTokenBalances`](../interfaces/PrizePoolTokenBalances.md) ; `chainId`: `number` = prizePool.chainId }[]\>

Fetch the users balances for all relevant tokens for all Prize Pools in the Prize Pool Network.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `usersAddress` | `string` | address to get balances for. |

#### Returns

`Promise`<{ `address`: `string` = prizePool.address; `balances`: [`PrizePoolTokenBalances`](../interfaces/PrizePoolTokenBalances.md) ; `chainId`: `number` = prizePool.chainId }[]\>

an array of objects containing the chain id & Prize Pool address and a balances object with the users balances for relevant tokens to the prize pool

#### Defined in

[src/PrizePoolNetwork.ts:105](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L105)

___

### id

▸ **id**(): `string`

Returns a unique id string for this PrizePoolNetwork.

#### Returns

`string`

a unique id for the PrizePoolNetwork

#### Defined in

[src/PrizePoolNetwork.ts:94](https://github.com/pooltogether/v4-client-js/blob/f28e2f3/src/PrizePoolNetwork.ts#L94)
