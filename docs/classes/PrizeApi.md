[@pooltogether/v4-client-js](../README.md) / [Exports](../modules.md) / PrizeApi

# Class: PrizeApi

PoolTogether Prize API.
Provides easy access to PoolTogether Prize APIs.

## Table of contents

### Constructors

- [constructor](PrizeApi.md#constructor)

### Methods

- [checkPrizeApiStatus](PrizeApi.md#checkprizeapistatus)
- [getCloudFlareDrawResultsUrl](PrizeApi.md#getcloudflaredrawresultsurl)
- [getDrawResultsStatusUrl](PrizeApi.md#getdrawresultsstatusurl)
- [getDrawResultsUrl](PrizeApi.md#getdrawresultsurl)
- [getUsersDrawResultsByDraw](PrizeApi.md#getusersdrawresultsbydraw)
- [getUsersDrawResultsByDraws](PrizeApi.md#getusersdrawresultsbydraws)

## Constructors

### constructor

• **new PrizeApi**()

## Methods

### checkPrizeApiStatus

▸ `Static` **checkPrizeApiStatus**(`chainId`, `prizeDistributorAddress`, `drawId`): `Promise`<`boolean`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `chainId` | `number` |
| `prizeDistributorAddress` | `string` |
| `drawId` | `number` |

#### Returns

`Promise`<`boolean`\>

#### Defined in

src/PrizeApi.ts:99

___

### getCloudFlareDrawResultsUrl

▸ `Static` **getCloudFlareDrawResultsUrl**(`chainId`, `prizeDistributorAddress`, `usersAddress`, `drawId`): `string`

Returns the URL that the prizes can be calculated at on CloudFlare

#### Parameters

| Name | Type |
| :------ | :------ |
| `chainId` | `number` |
| `prizeDistributorAddress` | `string` |
| `usersAddress` | `string` |
| `drawId` | `number` |

#### Returns

`string`

#### Defined in

src/PrizeApi.ts:166

___

### getDrawResultsStatusUrl

▸ `Static` **getDrawResultsStatusUrl**(`chainId`, `prizeDistributorAddress`, `drawId`): `string`

Returns the URL for the status of the calculations for the draw requested from the Prize API

#### Parameters

| Name | Type |
| :------ | :------ |
| `chainId` | `number` |
| `prizeDistributorAddress` | `string` |
| `drawId` | `number` |

#### Returns

`string`

#### Defined in

src/PrizeApi.ts:148

___

### getDrawResultsUrl

▸ `Static` **getDrawResultsUrl**(`chainId`, `prizeDistributorAddress`, `usersAddress`, `drawId`): `string`

Returns the URL for pre-calculated prizes from the Prize API
TODO: Fix the casing functions once Kames fixes the bug

#### Parameters

| Name | Type |
| :------ | :------ |
| `chainId` | `number` |
| `prizeDistributorAddress` | `string` |
| `usersAddress` | `string` |
| `drawId` | `number` |

#### Returns

`string`

#### Defined in

src/PrizeApi.ts:129

___

### getUsersDrawResultsByDraw

▸ `Static` **getUsersDrawResultsByDraw**(`chainId`, `usersAddress`, `prizeDistributorAddress`, `drawId`, `maxPicksPerUser`): `Promise`<[`DrawResults`](../modules.md#drawresults)\>

Fetches a users DrawResults for the provided draw id

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `number` | the chain id the PrizeDistributor is deployed on |
| `usersAddress` | `string` | the address of the user to fetch draw results for |
| `prizeDistributorAddress` | `string` | the address of the PrizeDistributor to fetch prizes for |
| `drawId` | `number` | the id of the draw to check |
| `maxPicksPerUser` | `number` | the maximum number of picks per user |

#### Returns

`Promise`<[`DrawResults`](../modules.md#drawresults)\>

#### Defined in

src/PrizeApi.ts:21

___

### getUsersDrawResultsByDraws

▸ `Static` **getUsersDrawResultsByDraws**(`chainId`, `usersAddress`, `prizeDistributorAddress`, `drawIds`, `maxPicksPerUser`): `Promise`<{ [drawId: number]: [`DrawResults`](../modules.md#drawresults);  }\>

Fetches a users DrawResults for the provided draw ids.
Checks the status of the Prize API, falls back to the CloudFlare worker if Prize API status is invalid.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chainId` | `number` | the chain id the PrizeDistributor is deployed on |
| `usersAddress` | `string` | the address of the user to fetch draw results for |
| `prizeDistributorAddress` | `string` | the address of the PrizeDistributor to fetch prizes for |
| `drawIds` | `number`[] | a list of draw ids to check for prizes |
| `maxPicksPerUser` | `number` | the maximum number of picks per user |

#### Returns

`Promise`<{ [drawId: number]: [`DrawResults`](../modules.md#drawresults);  }\>

#### Defined in

src/PrizeApi.ts:47
